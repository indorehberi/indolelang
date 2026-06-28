"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function TentangPage() {
  const branches = [
    { name: "DKI Jakarta (HQ)", address: "Kuningan, Jakarta Selatan", icon: "location_on" },
    { name: "Jawa Barat", address: "Soekarno Hatta, Bandung", icon: "location_on" },
    { name: "Jawa Timur", address: "Rungkut Industri, Surabaya", icon: "location_on" },
    { name: "Sumatra Utara", address: "Medan Baru, Kota Medan", icon: "location_on" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-container-max mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: About & Vision */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h1 className="text-heading-xl font-black text-on-surface leading-tight">
                Tentang BIDKU / IndoLelang
              </h1>
              <p className="text-body-lg text-on-surface-variant leading-relaxed mt-4">
                BIDKU (di bawah naungan PT INDO LELANG SEJAHTERA) didirikan dengan visi menjadi platform lelang digital nomor satu di Indonesia yang mengedepankan asas kecepatan, kenyamanan, keamanan, dan transparansi (*Hammer Price* transparan).
              </p>
              <p className="text-body-md text-on-surface-variant leading-relaxed mt-3">
                Kami mengintegrasikan teknologi verifikasi eKYC modern, Virtual Account bank-bank terkemuka Indonesia untuk deposit instan dan *auto-refund* 100% tanpa potongan, serta sistem penawaran lelang *anti-sniping real-time*.
              </p>
            </div>

            {/* Vision & Mission Card */}
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
              <div>
                <h3 className="text-heading-md font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">visibility</span>
                  Visi Kami
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed mt-2">
                  Mewujudkan ekosistem jual-beli aset bekas/lelang yang adil, efisien, dan dapat diakses dari mana saja secara digital di seluruh wilayah Indonesia.
                </p>
              </div>

              <div className="border-t border-outline-variant/10" />

              <div>
                <h3 className="text-heading-md font-bold text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined">track_changes</span>
                  Misi Kami
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed mt-2">
                  Memberikan pengalaman penawaran live lelang terbaik, transparansi pencatatan log bid secara real-time, dan kepastian hukum yang kuat melalui integrasi risalah lelang resmi.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Office Image & Branches */}
          <div className="lg:col-span-5 space-y-8">
            {/* Headquarters Image Wrapper */}
            <div className="bg-white rounded-3xl p-4 border border-outline-variant/20 shadow-sm">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-variant/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_R8j18nKSwK80H9f7yZ5_mE1R5P0L-KjX6l_eF1qYgG4N4a5m_2kLp-h1zQ5yvM8_1rFj6xO0V1N_4zTfL8v9M_2jV4v8R-FmZ-v5L8k7z-Fm9jV8mZ-Tf0v7K-L2z"
                  alt="Kantor Pusat IndoLelang Jakarta"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-5">
                  <div>
                    <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-badge-text font-bold uppercase tracking-wider mb-2 inline-block">
                      KANTOR PUSAT
                    </span>
                    <h3 className="text-white text-body-lg font-bold">
                      Gedung IndoLelang Tower
                    </h3>
                    <p className="text-white/80 text-body-sm mt-0.5">
                      Kuningan, Jakarta Selatan
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Branch Network */}
            <div className="space-y-4">
              <h3 className="text-heading-md font-bold text-on-surface">
                Jaringan Cabang Utama
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {branches.map((branch, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-4 border border-outline-variant/20 shadow-sm flex items-start gap-3 hover:border-primary transition-all group"
                  >
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors mt-0.5">
                      {branch.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-body-md text-on-surface">
                        {branch.name}
                      </h4>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        {branch.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
