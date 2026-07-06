'use client';

import React, { useState, useEffect } from 'react';
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

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch(apiUrl('/blogs'));
        const data = await response.json();
        if (response.ok && data.success) {
          setBlogs(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch blogs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const getExcerpt = (htmlContent: string) => {
    // Strip HTML tags for excerpt
    const plainText = htmlContent.replace(/<[^>]+>/g, '');
    return plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText;
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      
      <main className="flex-grow pt-10 pb-20">
        <div className="max-w-container-max mx-auto px-margin-page">
          <div className="text-center mb-12">
            <h1 className="text-heading-3xl font-bold text-on-background font-serif mb-4">
              Blog & Artikel
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Temukan informasi terbaru, tips, dan panduan seputar lelang kendaraan dan properti di Indo-Lelang.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-body-lg text-on-surface-variant">Memuat artikel...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-low rounded-3xl">
              <span className="material-symbols-outlined text-4xl text-outline mb-3">article</span>
              <p className="text-body-lg text-on-surface-variant">Belum ada artikel yang dipublikasikan saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link href={`/blog/${blog.slug}`} key={blog.id} className="group">
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-outline-variant/20 h-full flex flex-col">
                    <div className="aspect-[16/9] bg-surface-container-low relative overflow-hidden">
                      {blog.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={blog.image_url} 
                          alt={blog.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <span className="material-symbols-outlined text-4xl text-primary/50">image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="text-body-sm text-primary font-semibold mb-2">
                        {blog.published_at ? new Date(blog.published_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Belum dipublikasi'}
                      </div>
                      <h2 className="text-heading-md font-bold text-on-background mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h2>
                      <p className="text-body-md text-on-surface-variant mb-4 flex-grow line-clamp-3">
                        {getExcerpt(blog.content)}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/20">
                        <span className="text-body-sm font-medium text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">person</span>
                          {blog.author?.full_name || 'Admin'}
                        </span>
                        <span className="text-primary font-bold text-body-sm flex items-center gap-1">
                          Baca <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
