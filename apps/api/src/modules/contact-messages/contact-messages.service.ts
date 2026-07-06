import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

export class ContactMessagesService {
  async create(data: { nama: string; email: string; subjek: string; pesan: string }) {
    return prisma.contact_messages.create({ data });
  }

  async findAll(params: {
    page: number;
    limit: number;
    is_read?: boolean;
    search?: string;
  }) {
    const { page, limit, is_read, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.contact_messagesWhereInput = {};
    if (is_read !== undefined) {
      where.is_read = is_read;
    }
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subjek: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.contact_messages.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.contact_messages.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async markAsRead(id: string) {
    return prisma.contact_messages.update({
      where: { id },
      data: { is_read: true },
    });
  }

  async delete(id: string) {
    return prisma.contact_messages.delete({ where: { id } });
  }
}

export const contactMessagesService = new ContactMessagesService();
