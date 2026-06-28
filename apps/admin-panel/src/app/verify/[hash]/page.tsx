'use client';

import React, { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import { apiUrl } from '../../../lib/api';

interface DocDetails {
  document_type: 'invoice' | 'surat_jalan' | 'bast';
  document_number: string;
  generated_at: string;
  status: string;
  lot_title: string;
  session_title: string;
  bidder_name: string;
}

export default function VerifyPage({ params }: { params: { hash: string } }) {
  const hash = params.hash;
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<DocDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const response = await fetch(apiUrl(`/documents/${hash}/verify`));
        const data = await response.json();
        if (response.ok && data.success) {
          setDoc(data.data);
        } else {
          setError(data.error?.message || 'Dokumen tidak valid atau telah dimodifikasi.');
        }
      } catch (err) {
        setError('Gagal menghubungi server verifikasi.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [hash]);

  const getDocTypeName = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Invoice Pelunasan Resmi';
      case 'surat_jalan':
        return 'Surat Jalan Pengeluaran Unit';
      case 'bast':
        return 'Berita Acara Serah Terima (BAST)';
      default:
        return type;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f7fafc',
        padding: '20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1b4f72', margin: 0 }}>
            🏛️ Sistem Verifikasi Indo-Lelang
          </h2>
          <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '4px' }}>
            Layanan verifikasi keaslian dokumen digital berbasis blockchain & SHA-256 hash.
          </p>
        </div>

        {loading ? (
          <Card>
            <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
              <div style={{ fontSize: '2rem', marginBottom: '15px' }}>⏳</div>
              <div>Memproses dan mencocokkan tanda tangan digital dokumen...</div>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <span style={{ fontSize: '4rem', color: '#e53e3e' }}>⚠️</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e53e3e', marginTop: '10px' }}>
                Dokumen Tidak Terverifikasi!
              </h3>
              <p style={{ color: '#4a5568', marginTop: '8px', fontSize: '0.95rem' }}>
                {error}
              </p>
              <div
                style={{
                  background: '#fff5f5',
                  border: '1px solid #fed7d7',
                  padding: '12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#c53030',
                  marginTop: '20px',
                  wordBreak: 'break-all',
                }}
              >
                Hash: {hash}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '15px' }}>
                Peringatan: Dokumen fisik/digital ini kemungkinan palsu atau telah dimodifikasi secara ilegal.
              </p>
            </div>
          </Card>
        ) : doc ? (
          <Card>
            {/* Header Success Badge */}
            <div
              style={{
                background: '#f0fff4',
                border: '1px solid #c6f6d5',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <span style={{ fontSize: '3rem', color: '#38a169', display: 'block', lineHeight: 1 }}>✅</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#276749', marginTop: '10px', marginBottom: '2px' }}>
                DOKUMEN ASLI & VALID
              </h3>
              <span style={{ fontSize: '0.85rem', color: '#2f855a' }}>
                Tanda Tangan Digital Terverifikasi Sistem
              </span>
            </div>

            {/* Document Details */}
            <div style={{ padding: '0 10px' }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a0aec0', fontWeight: 'bold' }}>
                  Jenis Dokumen
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2d3748', marginTop: '2px' }}>
                  {getDocTypeName(doc.document_type)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a0aec0', fontWeight: 'bold' }}>
                    Nomor Dokumen
                  </span>
                  <div style={{ fontWeight: '600', color: '#2d3748', marginTop: '2px' }}>
                    {doc.document_number}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a0aec0', fontWeight: 'bold' }}>
                    Tanggal Diterbitkan
                  </span>
                  <div style={{ color: '#2d3748', marginTop: '2px' }}>
                    {new Date(doc.generated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB
                  </div>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a0aec0', fontWeight: 'bold' }}>
                  Nama Pemenang (Bidder)
                </span>
                <div style={{ fontWeight: '600', color: '#2d3748', marginTop: '2px' }}>
                  {doc.bidder_name}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a0aec0', fontWeight: 'bold' }}>
                  Aset & Lot Lelang
                </span>
                <div style={{ fontWeight: '600', color: '#2d3748', marginTop: '2px' }}>
                  {doc.lot_title}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '2px' }}>
                  {doc.session_title}
                </div>
              </div>

              <div
                style={{
                  background: '#f7fafc',
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  borderRadius: '6px',
                  marginTop: '25px',
                }}
              >
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a0aec0', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  Digital Signature Hash (SHA-256)
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#4a5568', wordBreak: 'break-all' }}>
                  {hash}
                </span>
              </div>
            </div>
          </Card>
        ) : null}

        <div style={{ textAlign: 'center', marginTop: '20px', color: '#a0aec0', fontSize: '0.75rem' }}>
          PT Indo Lelang Digital © 2026. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </div>
  );
}
