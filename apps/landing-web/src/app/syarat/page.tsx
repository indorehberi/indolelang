"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SyaratPage() {
  const sections = [
    {
      title: "1. Ketentuan Umum Pendaftaran",
      content:
        "Setiap peserta lelang (Bidder) wajib membuat akun terverifikasi menggunakan e-KTP dan nomor handphone yang aktif. Pendaftaran badan hukum/provider wajib menyertakan NPWP dan dokumen pendirian yang sah.",
      icon: "how_to_reg",
    },
    {
      title: "2. Uang Jaminan Lelang (Deposit / NIPL)",
      content:
        "Untuk mengikuti penawaran lot lelang, Bidder wajib menyetorkan deposit jaminan melalui sistem Virtual Account resmi. Satu tiket NIPL berlaku untuk memenangkan satu lot kendaraan. Jika Bidder tidak memenangkan satu lot pun dalam sesi lelang, uang deposit jaminan akan dikembalikan (refund) 100% tanpa potongan dalam kurun waktu maksimal 2 hari kerja.",
      icon: "payments",
    },
    {
      title: "3. Pelaksanaan Lelang & Hammer Price",
      content:
        "Penawaran harga lelang bersifat mengikat secara hukum. Ketika waktu sesi lelang berakhir dan tombol \"Hammer Price\" diketok oleh operator, penawar tertinggi dinyatakan sebagai Pemenang Lelang dan wajib melunasi sisa tagihan.",
      icon: "gavel",
    },
    {
      title: "4. Pembatalan Sepihak & Wanprestasi",
      content:
        "Apabila Pemenang Lelang tidak melakukan pelunasan sisa biaya pembelian dalam waktu maksimal 5 hari kerja setelah lelang selesai, pemenang dinyatakan Wanprestasi. Seluruh uang jaminan (deposit NIPL) akan hangus secara otomatis dan dialokasikan ke biaya administrasi platform.",
      icon: "gpp_bad",
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-[800px] mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-heading-xl font-black text-on-surface leading-tight font-serif">
            Syarat &amp; Ketentuan Umum Lelang
          </h1>
          <p className="text-body-lg text-on-surface-variant mt-2">
            Harap membaca panduan dan regulasi ini secara teliti sebelum mendaftar.
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
