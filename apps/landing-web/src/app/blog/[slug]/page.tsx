'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { apiUrl } from '@/lib/api';

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  image_url: string;
  published_at: string;
  author?: {
    full_name: string;
  };
}

export default function SingleBlogPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(apiUrl(`/blogs/${slug}`));
        const data = await response.json();
        if (response.ok && data.success) {
          setBlog(data.data);
        } else {
          setError('Artikel tidak ditemukan atau belum dipublikasi.');
        }
      } catch (err) {
        setError('Gagal memuat artikel.');
        console.error('Failed to fetch blog', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      
      <main className="flex-grow pt-8 pb-20">
        <div className="max-w-3xl mx-auto px-margin-page">
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary font-bold mb-8 hover:underline text-body-md">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali ke Daftar Artikel
          </Link>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-body-lg text-on-surface-variant">Memuat artikel...</p>
            </div>
          ) : error || !blog ? (
            <div className="text-center py-20 bg-surface-container-low rounded-3xl">
              <span className="material-symbols-outlined text-4xl text-outline mb-3">error</span>
              <h1 className="text-heading-xl font-bold mb-2">Oops!</h1>
              <p className="text-body-lg text-on-surface-variant">{error || 'Artikel tidak ditemukan.'}</p>
              <Button className="mt-6" onClick={() => router.push('/blog')}>
                Lihat Artikel Lainnya
              </Button>
            </div>
          ) : (
            <article className="bg-white rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden">
              {blog.image_url && (
                <div className="w-full aspect-[2/1] md:aspect-[21/9] bg-surface-container-low relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={blog.image_url} 
                    alt={blog.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6 md:p-10">
                <div className="flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant mb-6 border-b border-outline-variant/20 pb-6">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    {blog.published_at ? new Date(blog.published_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Belum dipublikasi'}
                  </div>
                  <div className="w-1 h-1 bg-outline rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">person</span>
                    {blog.author?.full_name || 'Admin'}
                  </div>
                </div>

                <h1 className="text-heading-2xl md:text-heading-3xl font-bold text-on-background font-serif mb-8 leading-tight">
                  {blog.title}
                </h1>

                {/* Content formatting wrapper */}
                <div 
                  className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Simple Button component for the error state
function Button({ children, onClick, className = '' }: { children: React.ReactNode, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
