import { prisma } from '../../config/database';
import { AuthService } from './auth.service';
import { FEAT_WHATSAPP_OTP } from '../../lib/featureToggle';
import { UserStatus } from '../../../../../packages/shared-types/src/enums';

jest.mock('../../lib/whatsapp', () => ({
  sendWhatsAppOtp: jest.fn().mockResolvedValue(true),
  sendWhatsAppNotification: jest.fn().mockResolvedValue(true),
  sendWhatsAppTest: jest.fn().mockResolvedValue(true),
}));

const whatsapp = require('../../lib/whatsapp');

/**
 * Saluran WhatsApp sedang tidak dipakai.
 *
 * Yang paling mudah salah di sini bukan pengirimannya, melainkan akibat
 * sampingannya: pendaftaran menandai akun sebagai PENDING "sampai OTP
 * diverifikasi". Kalau OTP tidak pernah dikirim, peserta baru terjebak
 * menunggu kode yang tidak akan pernah datang, dan daftar admin dipenuhi
 * akun yang seolah butuh tindakan padahal tidak ada yang bisa dilakukan.
 */
describe('Saluran WhatsApp dimatikan', () => {
  const tag = 'wamati';

  const setToggle = async (nilai: string | null) => {
    await prisma.platform_settings.deleteMany({ where: { key: FEAT_WHATSAPP_OTP } });
    if (nilai !== null) {
      await prisma.platform_settings.create({
        data: { tenant_id: 'default', key: FEAT_WHATSAPP_OTP, value: nilai, is_encrypted: false },
      });
    }
  };

  const bersihkan = async () => {
    await prisma.users.deleteMany({ where: { email: { contains: tag } } });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Pengirimannya "fire-and-forget" — pemanggil langsung merangkai .catch()
    // pada hasilnya, jadi tiruannya wajib mengembalikan promise.
    whatsapp.sendWhatsAppOtp.mockResolvedValue(true);
    whatsapp.sendWhatsAppNotification.mockResolvedValue(true);
    await bersihkan();
  });

  afterAll(async () => {
    await setToggle(null);
    await bersihkan();
    await prisma.$disconnect();
  });

  const authService = new AuthService();

  const daftar = (suffix: string) =>
    authService.register({
      email: `${tag}_${suffix}@t.test`,
      phone: `+62811${String(Date.now()).slice(-8)}`,
      password: 'RahasiaKuat123!',
      full_name: `Pendaftar ${suffix}`,
    } as any);

  it('tidak mengirim OTP WhatsApp saat salurannya mati', async () => {
    await setToggle(null); // kunci tak dikenal -> mati
    await daftar('a');

    expect(whatsapp.sendWhatsAppOtp).not.toHaveBeenCalled();
  }, 60_000);

  it('akun peserta baru langsung aktif, tidak menggantung menunggu kode', async () => {
    await setToggle(null);
    const hasil = await daftar('b');

    const user = await prisma.users.findUniqueOrThrow({ where: { id: hasil.id } });
    expect(user.status).toBe(UserStatus.ACTIVE);
  }, 60_000);

  it('kembali mengirim OTP dan menahan akun bila salurannya dinyalakan', async () => {
    await setToggle('true');
    const hasil = await daftar('c');

    expect(whatsapp.sendWhatsAppOtp).toHaveBeenCalledTimes(1);

    const user = await prisma.users.findUniqueOrThrow({ where: { id: hasil.id } });
    expect(user.status).toBe(UserStatus.PENDING);
  }, 60_000);

  it('permintaan reset password lewat WhatsApp tidak mengirim apa pun saat mati', async () => {
    await setToggle(null);
    const hasil = await daftar('d');
    const user = await prisma.users.findUniqueOrThrow({ where: { id: hasil.id } });

    await authService.forgotPassword(undefined, user.phone!, 'whatsapp');

    expect(whatsapp.sendWhatsAppNotification).not.toHaveBeenCalled();
  }, 60_000);
});
