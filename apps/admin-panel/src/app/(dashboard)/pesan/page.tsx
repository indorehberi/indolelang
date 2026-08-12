"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { apiFetch } from "../../../lib/api";
import { useToast } from "../../../providers/ToastProvider";
import { exportToExcel } from "../../../lib/excelExport";
import ColumnPicker, { useColumnVisibility, ColumnOption } from "../../../components/ui/ColumnPicker";

const PESAN_COLUMNS: ColumnOption[] = [
  { key: "pengirim", label: "Pengirim", alwaysVisible: true },
  { key: "subjek", label: "Subjek", defaultVisible: true },
  { key: "tanggal", label: "Tanggal", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "aksi", label: "Aksi", alwaysVisible: true },
];

interface ContactMessage {
  id: string;
  nama: string;
  email: string;
  subjek: string;
  pesan: string;
  is_read: boolean;
  created_at: string;
}

const formatShortDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) {
    return dateStr;
  }
};

const formatFullDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const timeFormatted = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${dateFormatted} ${timeFormatted}`;
  } catch (e) {
    return dateStr;
  }
};

export default function PesanMasukPage() {
  const toast = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility("pesan_inbox_list", PESAN_COLUMNS);

  // Filter and Sorting states
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/contact-messages");
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.data);
      } else {
        setError(data.error?.message || "Gagal mengambil pesan.");
      }
    } catch (err) {
      setError("Kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/admin/contact-messages/${id}/read`, { method: "PATCH" });
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const openDetail = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setShowDetailModal(true);
    if (!msg.is_read) {
      markAsRead(msg.id);
    }
  };

  const openDelete = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setShowDeleteModal(true);
  };

  const handleExport = () => {
    const dataToExport = filteredMessages.map((msg) => {
      const row: Record<string, any> = {};
      if (isVisible("pengirim")) {
        row["Nama Pengirim"] = msg.nama;
        row["Email"] = msg.email;
      }
      if (isVisible("subjek")) row["Subjek"] = msg.subjek;
      if (isVisible("tanggal")) row["Tanggal"] = formatFullDate(msg.created_at);
      if (isVisible("status")) row["Status"] = msg.is_read ? "Sudah Dibaca" : "Belum Dibaca";
      return row;
    });
    const ok = exportToExcel(dataToExport, "Pesan_Masuk_IndoLelang", "Pesan Masuk");
    if (ok) {
      toast.success("Berhasil mendownload laporan Excel Pesan Masuk (.xlsx)");
    } else {
      toast.error("Tidak ada data pesan untuk di-export");
    }
  };

  const handleDelete = async () => {
    if (!selectedMessage) return;
    try {
      await apiFetch(`/admin/contact-messages/${selectedMessage.id}`, { method: "DELETE" });
      fetchMessages();
      setShowDeleteModal(false);
      setSelectedMessage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMessages = messages
    .filter((msg) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = msg.nama.toLowerCase().includes(query);
        const matchesEmail = msg.email.toLowerCase().includes(query);
        const matchesSubjek = msg.subjek.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesSubjek) return false;
      }
      if (dateFilter) {
        const msgDateStr = msg.created_at.split("T")[0];
        if (msgDateStr !== dateFilter) return false;
      }
      if (monthFilter) {
        const msgMonth = new Date(msg.created_at).getMonth() + 1;
        if (msgMonth.toString() !== monthFilter) return false;
      }
      if (statusFilter === "read" && !msg.is_read) return false;
      if (statusFilter === "unread" && msg.is_read) return false;
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Pesan Masuk">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Pesan Masuk</h1>
          <p className="page-subtitle">Daftar pesan dari form Hubungi Kami.</p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Cari pesan..."
            className="search-box"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '250px' }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            style={{ backgroundColor: '#107c41', color: '#fff', borderColor: '#107c41' }}
          >
            📥 Export Excel
          </Button>
          <ColumnPicker
            columns={PESAN_COLUMNS}
            visibleKeys={visibleKeys}
            onChange={setVisibleKeys}
            tableId="pesan_inbox_list"
          />
        </div>
      </div>

      <Card className="mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Tanggal</label>
            <input
              type="date"
              className="search-box"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Bulan</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Urutkan</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Status</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua</option>
              <option value="read">Sudah Dibaca</option>
              <option value="unread">Belum Dibaca</option>
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {isVisible('pengirim') && <th>Pengirim</th>}
                {isVisible('subjek') && <th>Subjek</th>}
                {isVisible('tanggal') && <th>Tanggal</th>}
                {isVisible('status') && <th>Status</th>}
                {isVisible('aksi') && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleKeys.length} style={{ textAlign: 'center' }}>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={visibleKeys.length} style={{ textAlign: 'center' }}>
                    Tidak ada pesan cocok.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg.id}>
                    {isVisible('pengirim') && (
                      <td>
                        <div><strong>{msg.nama}</strong></div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{msg.email}</div>
                      </td>
                    )}
                    {isVisible('subjek') && <td>{msg.subjek}</td>}
                    {isVisible('tanggal') && <td>{formatShortDate(msg.created_at)}</td>}
                    {isVisible('status') && (
                      <td>
                        {msg.is_read ? (
                          <Badge variant="success">Sudah Dibaca</Badge>
                        ) : (
                          <Badge variant="warning">Belum Dibaca</Badge>
                        )}
                      </td>
                    )}
                    {isVisible('aksi') && (
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Button variant="outline" size="sm" onClick={() => openDetail(msg)}>
                            Detail
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => openDelete(msg)}>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedMessage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{selectedMessage.subjek}</h3>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      <strong>{selectedMessage.nama}</strong> &lt;{selectedMessage.email}&gt;
                    </div>
                    <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {formatFullDate(selectedMessage.created_at)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowDetailModal(false)}>Tutup</Button>
                </div>
                <div style={{ overflowY: 'auto', padding: '1rem 0', whiteSpace: 'pre-wrap', lineHeight: '1.6', flex: 1 }}>
                  {selectedMessage.pesan}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedMessage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-danger)' }}>Hapus Pesan</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              Apakah Anda yakin ingin menghapus pesan dari <strong>{selectedMessage.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" type="button" onClick={() => setShowDeleteModal(false)}>Batal</Button>
              <Button variant="danger" type="button" onClick={handleDelete}>Hapus</Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
