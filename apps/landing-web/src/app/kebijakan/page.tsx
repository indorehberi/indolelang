"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function KebijakanPage() {
  const sections = [
    {
      title: "1. Pengumpulan Data Pribadi",
      content:
        "Kami mengumpulkan data pribadi berupa alamat email, nama lengkap, dan kata sandi yang Anda berikan saat melakukan registrasi. Dokumen tambahan seperti foto e-KTP, swafoto (selfie), dan NPWP dikumpulkan khusus untuk kebutuhan verifikasi identitas (KYC) agar transaksi pelelangan terjamin keabsahannya secara hukum.",
      icon: "account_circle",
    },
    {
      title: "2. Penggunaan Informasi Pengguna",
      content:
        "Informasi yang dikumpulkan digunakan sepenuhnya untuk memproses pendaftaran akun, validasi data eKYC melalui verifikator resmi, menerbitkan nomor jaminan Virtual Account (NIPL), mencatat histori penawaran bidding, serta untuk menerbitkan dokumen pelunasan (Invoice, Surat Jalan, dan BAST).",
      icon: "data_usage",
    },
    {
      title: "3. Keamanan Data & Proteksi PII",
      content:
        "Data kata sandi Anda dienkripsi di server kami menggunakan algoritma bcrypt berkekuatan tinggi. Kami menerapkan standar enkripsi HTTPS untuk seluruh pengiriman data dan membatasi akses database hanya untuk operator terverifikasi. Kami berkomitmen untuk melindungi informasi identitas pribadi (PII) Anda dari akses tanpa izin.",
      icon: "shield_lock",
    },
    {
      title: "4. Pengungkapan Kepada Pihak Ketiga",
      content:
        "Kami tidak menjual atau menyebarluaskan data pribadi Anda ke pihak ketiga. Pengungkapan data hanya dilakukan secara terbatas untuk kebutuhan integrasi transaksi keuangan dengan payment gateway resmi (Midtrans/Xendit) serta verifikasi kependudukan eKYC (Verihubs) demi mematuhi regulasi hukum yang berlaku.",
      icon: "share",
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-[800px] mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-heading-xl font-black text-on-surface leading-tight font-serif">
            Kebijakan Privasi &amp; Perlindungan Data
          </h1>
          <p className="text-body-lg text-on-surface-variant mt-2">
            Bagaimana IndoLelang mengelola dan melindungi data pribadi Anda secara aman.
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl p-8 border border-outline-variant/20 shadow-sm space-y-8">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-3 group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                  {section.icon}
                </span>
                <h3 className="text-heading-md font-bold text-on-surface font-serif">
                  {section.title}
                </h3>
              </div>
              <p className="text-body-md text-on-surface-variant leading-relaxed pl-9">
                {section.content}
              </p>
              {idx < sections.length - 1 && (
                <div className="pt-4 border-b border-outline-variant/10" />
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
