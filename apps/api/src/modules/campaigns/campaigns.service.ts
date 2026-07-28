import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { sendEmail, sendEmailSafe } from '../../lib/email';
import { logger } from '../../lib/logger';
import { sendWhatsAppNotification } from '../../lib/whatsapp';

export class CampaignsService {
  async listCampaigns(page: number, perPage: number) {
    const skip = (page - 1) * perPage;
    
    const [total, records] = await Promise.all([
      prisma.campaigns.count(),
      prisma.campaigns.findMany({
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' }
      })
    ]);

    return {
      campaigns: records,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      }
    };
  }

  async createCampaign(data: { title: string; message: string; target_role: string; send_email?: boolean; send_wa?: boolean }) {
    // 1. Create campaign in draft mode first
    const campaign = await prisma.campaigns.create({
      data: {
        title: data.title,
        message: data.message,
        target_role: data.target_role,
        status: 'draft',
      }
    });

    // 2. Fetch target users (only active)
    const whereClause: any = { status: 'active' };
    if (data.target_role !== 'all') {
      whereClause.role = data.target_role;
    }

    const targetUsers = await prisma.users.findMany({
      where: whereClause,
      select: { id: true, email: true, phone: true, full_name: true }
    });

    if (targetUsers.length === 0) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Tidak ada pengguna aktif untuk role yang dipilih');
    }

    const notificationsToCreate = targetUsers.map(user => ({
      user_id: user.id,
      type: 'broadcast',
      title: data.title,
      body: data.message,
    }));

    await prisma.notifications.createMany({
      data: notificationsToCreate,
    });

    // 3. Trigger email & WhatsApp sending asynchronously (respecting parameters)
    const sendEmail = data.send_email !== false;
    const sendWa = data.send_wa !== false;
    
    this.sendCampaignBroadcasts(campaign.id, targetUsers, data.title, data.message, sendEmail, sendWa);

    return campaign;
  }

  private async sendCampaignBroadcasts(
    campaignId: string,
    users: Array<{ email: string; phone: string | null; full_name: string }>,
    title: string,
    message: string,
    sendEmail: boolean,
    sendWa: boolean
  ) {
    let sentCount = 0;
    
    for (const user of users) {
      let emailSuccess = false;
      let waSuccess = false;

      // Send Email
      if (sendEmail) {
        try {
          emailSuccess = await sendEmailSafe({
            to: user.email,
            subject: title,
            text: message,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>${title}</h2>
                <p>Halo <strong>${user.full_name}</strong>,</p>
                <div style="white-space: pre-wrap; margin: 20px 0; line-height: 1.6;">${message}</div>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #888; font-size: 0.8em;">Email ini dikirimkan melalui sistem Broadcast Indo-Lelang.</p>
              </div>
            `
          });
        } catch (err) {
          logger.error({ err, email: user.email }, 'Failed to send campaign email');
        }
      }

      // Send WhatsApp (only if phone is registered)
      if (sendWa && user.phone) {
        try {
          const waMessage = `*${title}*\n\nHalo ${user.full_name},\n\n${message}`;
          waSuccess = await sendWhatsAppNotification(user.phone, waMessage);
        } catch (err) {
          logger.error({ err, phone: user.phone }, 'Failed to send campaign WhatsApp message');
        }
      }

      if ((sendEmail && emailSuccess) || (sendWa && waSuccess) || (!sendEmail && !sendWa)) {
        sentCount++;
      }
    }

    // Update campaign status
    await prisma.campaigns.update({
      where: { id: campaignId },
      data: {
        status: 'sent',
        sent_count: sentCount,
        sent_at: new Date()
      }
    });
  }
}
