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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nama && formData.email && formData.subjek && formData.pesan) {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:3001/api/v1/contact-messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setSubmitted(true);
          setFormData({ nama: "", email: "", subjek: "", pesan: "" });
        } else {
          setError(data.error?.message || "Gagal mengirim pesan.");
        }
      } catch (err) {
        setError("Terjadi kesalahan jaringan.");
      } finally {
        setLoading(false);
      }
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
              <h1 className="text-heading-xl font-black text-on-surface leading-tight font-serif">
                Hubungi Kami
              </h1>
              <p className="text-body-lg text-on-surface-variant leading-relaxed mt-3">
                Punya pertanyaan seputar lelang, kerjasama kemitraan provider, atau masalah teknis pembayaran? Silakan kirimkan pesan kepada kami melalui formulir di bawah ini.
              </p>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error p-4 rounded-2xl flex items-center gap-3">
                <span className="material-symbols-outlined">error</span>
                <span className="font-bold text-body-md">{error}</span>
              </div>
            )}

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
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
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
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
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
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
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
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner resize-none"
                />
              </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary text-on-primary font-bold text-body-md rounded-xl btn-press hover:bg-primary/90 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined">send</span>
                  )}
                  {loading ? "Mengirim..." : "Kirim Pesan"}
                </button>
            </form>
          </div>

          {/* Right Column: Info & Maps */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-premium rounded-3xl p-6 border border-outline-variant/10 shadow-md text-on-premium text-left">
              <h3 className="text-heading-md font-bold text-primary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined">info</span>
                Informasi Kantor Pusat
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-primary">location_on</span>
                  <a
                    href="https://maps.app.goo.gl/TTfvM1o9M852AFKfA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-sm leading-relaxed hover:text-primary transition-colors hover:underline"
                  >
                    <strong>Unibang Building 8th Floor</strong>
                    <br />
                    Jl. Raden Patah Jl. Lembang II Lama No.62, Ciledug, Kota Tangerang, Banten 15151
                  </a>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-primary">mail</span>
                  <p className="text-body-sm">
                    <strong>Email Resmi:</strong>
                    <br />
                    cs@bidku.co.id
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-primary">phone</span>
                  <p className="text-body-sm">
                    <strong>Telepon Kantor:</strong>
                    <br />
                    082318037002
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-primary">sms</span>
                  <p className="text-body-sm">
                    <strong>WhatsApp CS (24/7):</strong>
                    <br />
                    +62-811-9988-7766
                  </p>
                </div>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/TTfvM1o9M852AFKfA"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-3xl p-4 border border-outline-variant/20 shadow-sm relative block hover:border-premium transition-all group"
            >
              <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-surface-variant/20 border border-outline-variant/10 relative">
                <iframe
                  src="https://maps.google.com/maps?q=Jl.+Raden+Patah+Jl.+Lembang+II+Lama+No.62,+Ciledug,+Kota+Tangerang,+Banten+15151&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="absolute inset-0 w-full h-full border-none pointer-events-none"
                  allowFullScreen
                  loading="lazy"
                  title="Google Map Kantor Bidku"
                ></iframe>
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                  <span className="bg-premium text-on-premium px-4 py-2 rounded-xl text-body-sm font-bold shadow-md flex items-center gap-1.5 transform scale-100 group-hover:scale-105 transition-transform duration-300">
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Buka Google Maps
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
