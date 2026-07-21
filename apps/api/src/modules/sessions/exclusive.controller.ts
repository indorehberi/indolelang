import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { htmlToPdf } from '../../lib/pdf';
import { SessionsService } from './sessions.service';
import { BAPL_LOGO_DATA_URI } from '../documents/bapl-logo';

const sessionsService = new SessionsService();

function formatIndoDate(date: Date): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Generate and download PDF Statement Document (SURAT PERNYATAAN)
 */
export async function downloadExclusiveStatement(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, 'User tidak terautentikasi');
    }

    const session = await prisma.auction_sessions.findUnique({
      where: { id: sessionId },
      include: {
        exclusive_provider: {
          include: {
            user: true
          }
        }
      }
    });

    if (!session) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
    }

    if (!session.is_exclusive || !session.exclusive_provider) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Sesi ini bukan merupakan sesi lelang eksklusif');
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        kyc_document: true
      }
    });

    if (!user) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'User tidak ditemukan');
    }

    const providerName = session.exclusive_provider.company_name || session.exclusive_provider.user.full_name;
    const bidderName = user.full_name;
    const bidderNik = user.kyc_document?.nik || '____________________';
    const bidderAddress = user.address || '____________________';
    const bidderPhone = user.phone || '____________________';
    const todayStr = formatIndoDate(new Date());

    const htmlContent = `
      <html>
      <head>
        <style>
          @page { margin: 15mm 20mm 15mm 20mm; }
          body, table, tr, td, p { font-family: 'Inter', sans-serif; color: #2d3748; padding: 0; margin: 0; line-height: 1.5; font-size: 12px; }
          .letterhead { display: flex; flex-direction: column; align-items: center; border-bottom: 2px solid #1b4f72; padding-bottom: 8px; margin-bottom: 15px; text-align: center; }
          .letterhead-logo { width: 280px; height: auto; margin-bottom: 4px; }
          .letterhead-text { width: 100%; }
          .letterhead-company { font-size: 14px; font-weight: bold; color: #1b4f72; text-transform: uppercase; margin: 0; }
          .letterhead-address { font-size: 9.5px; color: #4a5568; margin-top: 2px; line-height: 1.3; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 16px; font-weight: bold; margin: 0; text-decoration: underline; text-transform: uppercase; }
          .content { text-align: justify; }
          .content p { margin: 8px 0; }
          .form-table { margin: 15px 0; width: 100%; }
          .form-table td { padding: 4px 0; vertical-align: top; }
          .signatures { display: flex; justify-content: flex-end; margin-top: 40px; }
          .sig-box { width: 45%; text-align: center; }
          .sig-space { height: 75px; display: flex; align-items: center; justify-content: center; color: #a0aec0; font-style: italic; font-size: 10px; }
          .materai-box { border: 1px dashed #718096; width: 90px; height: 50px; margin: 10px auto; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="letterhead">
          <img class="letterhead-logo" src="${BAPL_LOGO_DATA_URI}" alt="Logo PT Indo Lelang Sejahtera" />
          <div class="letterhead-text">
            <p class="letterhead-company">PT Indo Lelang Sejahtera</p>
            <div class="letterhead-address">
              Gedung UNIBANG, Jl. Raden Patah No.62, RT.003/RW.010, Sudimara Barat, Kec. Ciledug, Kota Tangerang, Banten 15151<br />
              www.bidku.co.id &bull; cs@bidku.co.id &bull; +6282318037002
            </div>
          </div>
        </div>
        
        <div class="header">
          <p class="title">SURAT PERNYATAAN</p>
        </div>

        <div class="content">
          <p>Yang bertanda tangan di bawah ini :</p>
          <table class="form-table">
            <tr>
              <td style="width: 120px;">Nama</td>
              <td style="width: 15px;">:</td>
              <td><strong>${bidderName}</strong></td>
            </tr>
            <tr>
              <td>NIK</td>
              <td>:</td>
              <td>${bidderNik}</td>
            </tr>
            <tr>
              <td>Alamat</td>
              <td>:</td>
              <td>${bidderAddress}</td>
            </tr>
            <tr>
              <td>No. HP</td>
              <td>:</td>
              <td>${bidderPhone}</td>
            </tr>
          </table>

          <p>Dengan ini menyatakan dengan sebenarnya bahwa:</p>
          <p>1. Saya bukan merupakan karyawan <strong>${providerName}</strong>.</p>
          <p>2. Saya tidak memiliki hubungan keluarga, baik karena hubungan darah maupun perkawinan, dengan karyawan <strong>${providerName}</strong>.</p>
          <p>3. Saya tidak bertindak sebagai perwakilan, titipan, atau pihak yang mewakili kepentingan karyawan <strong>${providerName}</strong>, termasuk keluarga maupun kerabat karyawan <strong>${providerName}</strong>, dalam mengikuti lelang ini.</p>
          <p>4. Seluruh data dan informasi yang saya berikan adalah benar dan dapat dipertanggungjawabkan.</p>

          <p style="margin-top: 15px;">Apabila di kemudian hari diketahui bahwa pernyataan ini tidak benar atau terbukti saya memiliki hubungan sebagaimana dimaksud di atas, maka saya bersedia menerima keputusan penyelenggara lelang untuk membatalkan status saya sebagai pemenang lelang, membatalkan transaksi atas unit yang dimenangkan, serta melepaskan segala hak untuk mengajukan tuntutan, gugatan, atau klaim dalam bentuk apa pun kepada <strong>${providerName}</strong> maupun penyelenggara lelang. Demikian surat pernyataan ini saya buat dengan sebenar-benarnya, tanpa adanya paksaan dari pihak mana pun, untuk dipergunakan sebagaimana mestinya.</p>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <p>Tangerang, ${todayStr}</p>
            <p style="margin-bottom: 5px;">Peserta dan/Pemenang Lelang,</p>
            <div class="materai-box">Materai Rp10.000</div>
            <div class="sig-space">(Tanda Tangan Basah)</div>
            <p><strong>${bidderName}</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await htmlToPdf(htmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="surat-pernyataan-${sessionId}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Register bidder for an exclusive session by uploading signed document
 */
export async function registerExclusive(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, 'User tidak terautentikasi');
    }

    if (!file) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'File dokumen surat pernyataan harus diunggah');
    }

    const reg = await sessionsService.registerExclusiveSession(sessionId, userId, file);

    return res.status(200).json({
      success: true,
      message: 'Pendaftaran lelang eksklusif berhasil diajukan',
      data: {
        id: reg.id,
        session_id: reg.session_id,
        bidder_id: reg.bidder_id,
        document_url: reg.document_url,
        status: reg.status
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get registration status of the logged-in bidder
 */
export async function getRegistrationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, 'User tidak terautentikasi');
    }

    const statusData = await sessionsService.getExclusiveRegistrationStatus(sessionId, userId);

    return res.status(200).json({
      success: true,
      message: 'Operasi berhasil',
      data: statusData
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get list of registrants for an exclusive session (Admin only)
 */
export async function getRegistrants(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: sessionId } = req.params;
    
    const registrants = await sessionsService.getExclusiveRegistrants(sessionId);

    return res.status(200).json({
      success: true,
      message: 'Operasi berhasil',
      data: registrants
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve a registrant (Admin only)
 */
export async function approveRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: sessionId, regId } = req.params;

    const reg = await sessionsService.approveExclusiveRegistrant(sessionId, regId);

    return res.status(200).json({
      success: true,
      message: 'Pendaftar berhasil disetujui',
      data: reg
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject a registrant (Admin only)
 */
export async function rejectRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: sessionId, regId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Alasan penolakan harus diisi');
    }

    const reg = await sessionsService.rejectExclusiveRegistrant(sessionId, regId, reason);

    return res.status(200).json({
      success: true,
      message: 'Pendaftar berhasil ditolak',
      data: reg
    });
  } catch (error) {
    next(error);
  }
}
