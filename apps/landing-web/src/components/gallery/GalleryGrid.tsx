'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface Gallery {
  id: string;
  image_url: string;
  created_at: string;
}

interface GalleryGridProps {
  galleries: Gallery[];
  loading?: boolean;
}

export default function GalleryGrid({ galleries, loading }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface-container-low rounded-2xl h-64 w-full"></div>
        ))}
      </div>
    );
  }

  if (!galleries || galleries.length === 0) {
    return (
      <div className="text-center py-12 text-outline">
        Belum ada gambar di gallery.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {galleries.map((gallery) => (
          <div 
            key={gallery.id} 
            className="group relative rounded-2xl overflow-hidden cursor-pointer bg-surface-variant/30 border border-outline-variant/30 h-64 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            onClick={() => setSelectedImage(gallery.image_url)}
          >
            <Image
              src={gallery.image_url}
              alt="Gallery"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 text-4xl drop-shadow-lg">
                zoom_in
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Popup */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-50 p-2 rounded-full bg-black/50 hover:bg-black/80"
            onClick={() => setSelectedImage(null)}
          >
            <span className="material-symbols-outlined text-3xl block">close</span>
          </button>
          
          <div 
            className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Gallery Full Size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
