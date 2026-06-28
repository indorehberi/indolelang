"use client";

import React, { useState, useEffect } from "react";
import BidderLayout from "../../../components/layout/BidderLayout";

export default function BidderProfile() {
  const [name, setName] = useState("Budi Santoso");
  const [email, setEmail] = useState("budi.santoso@gmail.com");
  const [phone, setPhone] = useState("081234567890");
  const [ekycStatus, setEkycStatus] = useState("verified");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.full_name) setName(user.full_name);
          if (user.email) setEmail(user.email);
          if (user.phone) setPhone(user.phone);
        } catch (e) {}
      }
      const storedEkyc = localStorage.getItem("user_ekyc_status");
      if (storedEkyc) setEkycStatus(storedEkyc);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Profil berhasil diperbarui!");
    }, 1000);
  };

  return (
    <BidderLayout pageTitle="Profil &amp; eKYC">
      <p className="page-subtitle">Kelola informasi akun Anda dan pantau verifikasi identitas</p>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">Data Profil Pengguna</div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="panel-form-group">
              <label className="panel-form-label">Nama Lengkap (Sesuai KTP)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="panel-form-input"
                required
              />
            </div>
            <div className="panel-form-group">
              <label className="panel-form-label">Alamat Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="panel-form-input bg-slate-50 cursor-not-allowed"
              />
            </div>
            <div className="panel-form-group">
              <label className="panel-form-label">Nomor WhatsApp / Telepon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="panel-form-input"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20"
            >
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">Status Verifikasi eKYC</div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {ekycStatus === "verified" ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center font-bold text-lg border border-success/25">
                    <span className="material-symbols-outlined text-2xl filled">verified_user</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Verifikasi Berhasil</div>
                    <div className="text-[10px] text-success font-bold uppercase tracking-wider">Aktif</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center font-bold text-lg border border-warning/25">
                    <span className="material-symbols-outlined text-2xl filled">warning</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Menunggu Verifikasi</div>
                    <div className="text-[10px] text-warning font-bold uppercase tracking-wider">Pending Review</div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-outline-variant/20 pt-4 space-y-3">
              <p className="text-xs text-slate-600">
                Penyedia eKYC kami sedang memvalidasi kesesuaian data KTP Anda dengan instansi kependudukan.
              </p>
              <div className="p-3 bg-slate-50 border border-outline-variant/30 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dokumen KTP:</span>
                  <span className="font-bold text-success">Telah Diunggah</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Foto Selfie:</span>
                  <span className="font-bold text-success">Telah Diunggah</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BidderLayout>
  );
}
