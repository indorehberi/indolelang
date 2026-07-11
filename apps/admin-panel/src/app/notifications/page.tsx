'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { apiFetch } from '../../lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const path = filterUnread ? '/notifications?is_read=false' : '/notifications';
      const res = await apiFetch(path);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterUnread]);

  const markAsRead = async (id: string) => {
    try {
      const res = await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!confirm('Tandai semua notifikasi sudah dibaca?')) return;
    try {
      const res = await apiFetch(`/notifications/read-all`, { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ fontSize: 'var(--fs-xl)', fontWeight: 'bold' }}>Pusat Notifikasi</h1>
        <div>
          <Button variant="outline" onClick={() => setFilterUnread(!filterUnread)} style={{ marginRight: '10px' }}>
            {filterUnread ? 'Semua Notifikasi' : 'Hanya Belum Dibaca'}
          </Button>
          <Button variant="primary" onClick={markAllAsRead}>
            Tandai Semua Dibaca
          </Button>
        </div>
      </div>

      <Card title="Daftar Notifikasi">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Memuat notifikasi...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Tidak ada notifikasi.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px',
                  backgroundColor: notif.is_read ? 'transparent' : '#ebf5fb',
                  cursor: 'pointer'
                }}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Badge variant={notif.type === 'kyc_pending' ? 'warning' : 'info'}>
                      {notif.type}
                    </Badge>
                    {!notif.is_read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />}
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: notif.is_read ? 'normal' : 'bold' }}>
                    {notif.title}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {notif.message}
                  </p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(notif.created_at).toLocaleString('id-ID')}
                  </div>
                  {!notif.is_read && (
                    <Button variant="outline" size="sm" style={{ marginTop: '8px' }} onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}>
                      Tandai Dibaca
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
