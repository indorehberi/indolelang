'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { usePublicGalleries } from '@/hooks/usePublicData';

export default function GalleryPage() {
  const [page, setPage] = useState(1);
  const perPage = 15; // 5 rows * 3 columns

  const { data: response, isLoading } = usePublicGalleries(page, perPage);
  
  const galleries = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, per_page: perPage };
  const totalPages = Math.ceil(meta.total / perPage);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface">
        <section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-surface-container-low">
          <div className="max-w-container-max mx-auto px-margin-page text-center">
            <h1 className="text-heading-2xl md:text-[3rem] font-extrabold text-on-background font-serif">
              Gallery Lelang BIDKU
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto mt-4">
              Koleksi momen terbaik, acara lelang, dan berbagai aset berkualitas di platform kami.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="max-w-container-max mx-auto px-margin-page">
            <GalleryGrid galleries={galleries} loading={isLoading} />

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-full border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        page === p
                          ? 'bg-primary text-white shadow-md'
                          : 'text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-full border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
