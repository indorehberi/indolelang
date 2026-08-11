'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { apiFetch } from '../../lib/api';

type TabType = 'assets' | 'bidders' | 'providers' | 'sessions';

interface Asset {
  id: string;
  title: string;
  category: string;
  base_price: number;
  police_number?: string;
  brand?: string;
  model?: string;
  year?: number | string;
  status: string;
  provider?: {
    company_name?: string;
    full_name?: string;
  };
}

interface Bidder {
  id: string;
  status: string;
  user?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
  kyc?: {
    nik?: string;
    status: string;
  };
}

interface Provider {
  id: string;
  status: string;
  company_name?: string;
  npwp?: string;
  user?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface Session {
  id: string;
  title: string;
  status: string;
  scheduled_at: string;
  branch?: {
    name: string;
    city: string;
  };
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams?.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(q);
  const [activeTab, setActiveTab] = useState<TabType>('assets');
  const [loading, setLoading] = useState(false);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const executeSearch = useCallback(async (queryStr: string) => {
    if (!queryStr.trim()) {
      setAssets([]);
      setBidders([]);
      setProviders([]);
      setSessions([]);
      return;
    }

    setLoading(true);
    try {
      const [resAssets, resBidders, resProviders, resSessions] = await Promise.all([
        apiFetch(`/assets?search=${encodeURIComponent(queryStr)}`),
        apiFetch(`/admin/bidders?search=${encodeURIComponent(queryStr)}`),
        apiFetch(`/admin/providers?search=${encodeURIComponent(queryStr)}`),
        apiFetch(`/sessions?search=${encodeURIComponent(queryStr)}`),
      ]);

      const [dataAssets, dataBidders, dataProviders, dataSessions] = await Promise.all([
        resAssets.ok ? resAssets.json() : { success: false, data: [] },
        resBidders.ok ? resBidders.json() : { success: false, data: [] },
        resProviders.ok ? resProviders.json() : { success: false, data: [] },
        resSessions.ok ? resSessions.json() : { success: false, data: [] },
      ]);

      const assetsList = dataAssets.success ? dataAssets.data || [] : [];
      const biddersList = dataBidders.success ? dataBidders.data || [] : [];
      const providersList = dataProviders.success ? dataProviders.data || [] : [];
      const sessionsList = dataSessions.success ? dataSessions.data || [] : [];

      setAssets(assetsList);
      setBidders(biddersList);
      setProviders(providersList);
      setSessions(sessionsList);

      // Auto focus tab that has results
      if (assetsList.length > 0) {
        setActiveTab('assets');
      } else if (biddersList.length > 0) {
        setActiveTab('bidders');
      } else if (providersList.length > 0) {
        setActiveTab('providers');
      } else if (sessionsList.length > 0) {
        setActiveTab('sessions');
      } else {
        setActiveTab('assets');
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearchQuery(q);
    executeSearch(q);
  }, [q, executeSearch]);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusBadgeVariant = (status: string) => {
    const s = status.toLowerCase();
    if (['aktif', 'approved', 'listed', 'sold', 'published'].includes(s)) return 'success';
    if (['antri', 'pending', 'draft', 'live'].includes(s)) return 'warning';
    return 'danger';
  };

  const totalResults = assets.length + bidders.length + providers.length + sessions.length;

  return (
    <DashboardLayout breadcrumbParent="Admin Panel" breadcrumbCurrent="Pencarian Global">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Search header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍 Hasil Pencarian</h1>
          <p className="page-subtitle" style={{ fontSize: '1rem' }}>
            Menampilkan hasil pencarian untuk kata kunci <strong style={{ color: 'var(--wf-primary)' }}>&ldquo;{q}&rdquo;</strong>
          </p>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: '600px', margin: '1.5rem auto 0' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lot, bidder, provider, atau sesi..."
              style={{
                flex: 1,
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                border: '1px solid var(--wf-border-dark)',
                fontSize: '1rem',
                backgroundColor: 'var(--wf-white)',
                color: 'var(--wf-text)',
                boxShadow: 'var(--shadow)',
              }}
            />
            <Button type="submit" variant="primary" style={{ padding: '0 1.5rem', fontWeight: 600 }}>Cari</Button>
          </form>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid var(--wf-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--wf-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Memuat hasil pencarian...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <>
            {/* Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--wf-border)', marginBottom: '1.5rem', overflowX: 'auto', gap: '0.5rem' }}>
              {(
                [
                  { type: 'assets', label: 'Unit', count: assets.length, icon: '🚗' },
                  { type: 'bidders', label: 'Bidder', count: bidders.length, icon: '👤' },
                  { type: 'providers', label: 'Provider', count: providers.length, icon: '🏢' },
                  { type: 'sessions', label: 'Sesi Lelang', count: sessions.length, icon: '🔨' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 1.25rem',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeTab === tab.type ? '3px solid var(--wf-primary)' : '3px solid transparent',
                    color: activeTab === tab.type ? 'var(--wf-primary)' : 'var(--wf-text-muted)',
                    fontWeight: activeTab === tab.type ? 700 : 500,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: activeTab === tab.type ? 'var(--wf-primary)' : 'var(--wf-border)',
                    color: activeTab === tab.type ? '#fff' : 'var(--wf-text-light)',
                    fontWeight: 700,
                    marginLeft: '4px',
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ minHeight: '300px' }}>
              {activeTab === 'assets' && (
                <div>
                  {assets.length === 0 ? (
                    <EmptyState type="Unit" />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                      {assets.map((asset) => (
                        <Card key={asset.id} title="">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <Badge variant={getStatusBadgeVariant(asset.status)}>{asset.status.toUpperCase()}</Badge>
                                <span style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>ID: {asset.id.slice(0, 8)}...</span>
                              </div>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--wf-text)' }}>
                                {asset.title}
                              </h3>
                              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--wf-text-light)', flexWrap: 'wrap' }}>
                                <span><strong>Merek:</strong> {asset.brand || '-'}</span>
                                <span><strong>Model:</strong> {asset.model || '-'}</span>
                                <span><strong>Tahun:</strong> {asset.year || '-'}</span>
                                <span><strong>No. Polisi:</strong> {asset.police_number || '-'}</span>
                                <span><strong>Kategori:</strong> <span style={{ textTransform: 'capitalize' }}>{asset.category}</span></span>
                              </div>
                              {asset.provider && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', marginTop: '0.4rem' }}>
                                  🏢 Pemilik: <strong>{asset.provider.company_name || asset.provider.full_name || 'Provider'}</strong>
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--wf-primary)' }}>
                                {formatPrice(asset.base_price)}
                              </div>
                              <Button variant="primary" size="sm" onClick={() => router.push(`/assets/${asset.id}`)}>
                                Kelola Unit ⚙️
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bidders' && (
                <div>
                  {bidders.length === 0 ? (
                    <EmptyState type="Bidder" />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                      {bidders.map((bidder) => (
                        <Card key={bidder.id} title="">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Badge variant={getStatusBadgeVariant(bidder.status)}>{bidder.status.toUpperCase()}</Badge>
                                {bidder.kyc && (
                                  <Badge variant={bidder.kyc.status === 'approved' ? 'success' : 'warning'}>
                                    KYC {bidder.kyc.status.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--wf-text)' }}>
                                {bidder.user?.full_name || 'Bidder Tanpa Nama'}
                              </h3>
                              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--wf-text-light)', flexWrap: 'wrap' }}>
                                <span>📧 {bidder.user?.email || '-'}</span>
                                <span>📞 {bidder.user?.phone || '-'}</span>
                                {bidder.kyc?.nik && <span>🪪 NIK: {bidder.kyc.nik}</span>}
                              </div>
                            </div>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/users/bidder?search=${encodeURIComponent(bidder.user?.full_name || '')}`)}
                              >
                                Lihat Bidder 👤
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'providers' && (
                <div>
                  {providers.length === 0 ? (
                    <EmptyState type="Provider" />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                      {providers.map((prov) => (
                        <Card key={prov.id} title="">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Badge variant={getStatusBadgeVariant(prov.status)}>{prov.status.toUpperCase()}</Badge>
                              </div>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--wf-text)' }}>
                                {prov.company_name || prov.user?.full_name || 'Provider Tanpa Nama'}
                              </h3>
                              {prov.company_name && prov.user?.full_name && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', marginBottom: '0.4rem' }}>
                                  PIC: <strong>{prov.user.full_name}</strong>
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--wf-text-light)', flexWrap: 'wrap' }}>
                                <span>📧 {prov.user?.email || '-'}</span>
                                <span>📞 {prov.user?.phone || '-'}</span>
                                {prov.npwp && <span>🧾 NPWP: {prov.npwp}</span>}
                              </div>
                            </div>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/users/provider?search=${encodeURIComponent(prov.company_name || prov.user?.full_name || '')}`)}
                              >
                                Lihat Provider 🏢
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sessions' && (
                <div>
                  {sessions.length === 0 ? (
                    <EmptyState type="Sesi Lelang" />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                      {sessions.map((sess) => (
                        <Card key={sess.id} title="">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Badge variant={getStatusBadgeVariant(sess.status)}>{sess.status.toUpperCase()}</Badge>
                                {sess.branch && (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--wf-text-muted)' }}>
                                    📍 Cabang: {sess.branch.name} ({sess.branch.city})
                                  </span>
                                )}
                              </div>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--wf-text)' }}>
                                {sess.title}
                              </h3>
                              <div style={{ fontSize: '0.85rem', color: 'var(--wf-text-light)' }}>
                                📅 Jadwal: <strong>{new Date(sess.scheduled_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</strong>
                              </div>
                            </div>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/sessions?search=${encodeURIComponent(sess.title)}`)}
                              >
                                Buka Sesi 🔨
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total Results Summary */}
            <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--wf-text-muted)', fontSize: '0.85rem' }}>
              Ditemukan total <strong>{totalResults}</strong> data yang cocok dengan kata kunci &ldquo;{q}&rdquo;.
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      backgroundColor: 'var(--wf-white)',
      border: '2px dashed var(--wf-border)',
      borderRadius: '8px',
      textAlign: 'center',
      color: 'var(--wf-text-muted)'
    }}>
      <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📂</span>
      <p style={{ fontWeight: 600, fontSize: '1rem', margin: '0 0 0.25rem 0', color: 'var(--wf-text)' }}>Hasil tidak ditemukan</p>
      <p style={{ fontSize: '0.85rem', margin: 0 }}>Tidak ada data {type} yang cocok dengan kata kunci pencarian Anda.</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--wf-text-light)' }}>Memuat...</p>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
