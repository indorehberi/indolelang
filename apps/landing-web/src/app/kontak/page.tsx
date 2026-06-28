"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function KontakPage() {
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    subjek: "",
    pesan: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nama && formData.email && formData.subjek && formData.pesan) {
      setSubmitted(true);
      setFormData({ nama: "", email: "", subjek: "", pesan: "" });
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-container-max mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-heading-xl font-black text-on-surface leading-tight">
                Hubungi Kami
              </h1>
              <p className="text-body-lg text-on-surface-variant leading-relaxed mt-3">
                Punya pertanyaan seputar lelang, kerjasama kemitraan provider, atau masalah teknis pembayaran? Silakan kirimkan pesan kepada kami melalui formulir di bawah ini.
              </p>
            </div>

            {submitted && (
              <div className="bg-success/10 border border-success/30 text-success p-5 rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined">check_circle</span>
                <div>
                  <span className="font-bold text-body-md block">Pesan Berhasil Terkirim!</span>
                  <span className="text-body-sm block mt-0.5">Terima kasih. Tim support kami akan menghubungi Anda kembali secepatnya.</span>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-sm space-y-4"
            >
              <div>
                <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                  Nama Lengkap <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama Anda"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                  Alamat Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Masukkan email Anda"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                  Subjek Pesan <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.subjek}
                  onChange={(e) => setFormData({ ...formData, subjek: e.target.value })}
                  placeholder="Misal: Kerjasama Provider, Error Bayar"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                  Isi Pesan <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.pesan}
                  onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                  placeholder="Tuliskan detail pertanyaan atau keluhan Anda..."
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-primary text-on-primary rounded-xl text-body-md font-bold hover:bg-primary/90 transition-all btn-press shadow-md"
              >
                Kirim Pesan
              </button>
            </form>
          </div>

          {/* Right Column: Info & Maps */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-primary rounded-3xl p-6 border border-outline-variant/10 shadow-md text-on-primary text-left">
              <h3 className="text-heading-md font-bold text-secondary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined">info</span>
                Informasi Kantor Pusat
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-secondary">location_on</span>
                  <p className="text-body-md leading-relaxed">
                    <strong>Gedung IndoLelang Tower</strong>
                    <br />
                    Jl. Kuningan Mulia Blok X-5 No. 18, Jakarta Selatan, DKI Jakarta 12940.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-secondary">mail</span>
                  <p className="text-body-md">
                    <strong>Email Resmi:</strong>
                    <br />
                    info@indolelang.com / support@indolelang.com
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-secondary">phone</span>
                  <p className="text-body-md">
                    <strong>Telepon Kantor:</strong>
                    <br />
                    (021) 5098-8888
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-secondary">sms</span>
                  <p className="text-body-md">
                    <strong>WhatsApp CS (24/7):</strong>
                    <br />
                    +62-811-9988-7766
                  </p>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-3xl p-4 border border-outline-variant/20 shadow-sm relative">
              <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-surface-variant/20 border border-outline-variant/10 relative flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_R8j18nKSwK80H9f7yZ5_mE1R5P0L-KjX6l_eF1qYgG4N4a5m_2kLp-h1zQ5yvM8_1rFj6xO0V1N_4zTfL8v9M_2jV4v8R-FmZ-v5L8k7z-Fm9jV8mZ-Tf0v7K-L2z"
                  className="absolute inset-0 w-full h-full object-cover filter brightness-75 grayscale"
                  alt="Map mockup"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-body-sm font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">map</span>
                    Buka di Google Maps
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
