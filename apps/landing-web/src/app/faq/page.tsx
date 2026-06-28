"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Bagaimana cara mendaftar sebagai peserta lelang?",
      answer:
        "Anda dapat menekan tombol \"Daftar\" di header homepage, mengisi data formulir, melakukan verifikasi eKYC dengan mengambil foto e-KTP dan foto selfie. Setelah eKYC disetujui dalam 10 menit, akun Anda siap digunakan.",
    },
    {
      question: "Apakah uang deposit akan hangus jika saya kalah lelang?",
      answer:
        "Tidak. Uang jaminan (deposit NIPL) Anda dijamin aman 100%. Jika Anda kalah lelang atau tidak mengajukan penawaran, dana deposit akan di-refund sepenuhnya tanpa potongan administrasi langsung ke rekening bank yang Anda daftarkan dalam waktu maksimal 2 hari kerja.",
    },
    {
      question: "Apa itu sistem Anti-Sniping?",
      answer:
        "Anti-Sniping adalah sistem perlindungan untuk menghindari penawaran curang di detik-detik terakhir lelang. Jika ada peserta lelang melakukan bid baru dalam waktu kurang dari 2 menit sebelum penutupan lot, durasi countdown akan diperpanjang secara otomatis selama 2 menit tambahan untuk memberikan kesempatan kepada penawar lain.",
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-[800px] mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-heading-xl font-black text-on-surface leading-tight">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h1>
          <p className="text-body-lg text-on-surface-variant mt-2">
            Temukan jawaban cepat untuk pertanyaan umum seputar proses lelang digital kami.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-bold text-body-lg text-on-surface hover:text-primary transition-colors focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <span
                    className={`material-symbols-outlined text-outline transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  >
                    keyboard_arrow_down
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[500px] opacity-100 border-t border-outline-variant/10" : "max-h-0 opacity-0"
                  }`}
                  style={{ overflow: "hidden" }}
                >
                  <div className="px-6 py-5 text-body-md text-on-surface-variant leading-relaxed bg-surface/30">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
