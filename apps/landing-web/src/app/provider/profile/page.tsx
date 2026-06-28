"use client";

import React, { useState } from "react";
import ProviderLayout from "../../../components/layout/ProviderLayout";

export default function ProviderProfile() {
  const [companyName, setCompanyName] = useState("PT Astra Mitra");
  const [npwp, setNpwp] = useState("01.234.567.8-012.000");
  const [picName, setPicName] = useState("Hendra Wijaya");
  const [phone, setPhone] = useState("081234567890");
  const [bankAccount, setBankAccount] = useState("BCA - 8923-9012-92");
  const [bankOwner, setBankOwner] = useState("PT Astra Mitra");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Profil perusahaan berhasil diperbarui!");
    }, 1000);
  };

  return (
    <ProviderLayout pageTitle="Profil Perusahaan">
      <p className="page-subtitle">Kelola informasi mitra provider, legalitas, dan rekening pencairan</p>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">Data Administrasi &amp; PIC</div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="panel-form-group">
              <label className="panel-form-label">Nama Perusahaan (Sesuai SIUP)</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="panel-form-input"
                required
              />
            </div>
            <div className="panel-form-group">
              <label className="panel-form-label">Nomor NPWP Perusahaan</label>
              <input
                type="text"
                value={npwp}
                onChange={(e) => setNpwp(e.target.value)}
                className="panel-form-input"
                required
              />
            </div>
            <div className="panel-form-group">
              <label className="panel-form-label">Nama Penanggung Jawab (PIC)</label>
              <input
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="panel-form-input"
                required
              />
            </div>
            <div className="panel-form-group">
              <label className="panel-form-label">WhatsApp PIC</label>
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
              className="px-5 py-2.5 bg-secondary hover:bg-secondary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-secondary/20"
            >
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">Rekening Tujuan Pencairan Dana</div>
          <div className="space-y-4">
            <div className="alert-box success text-xs">
              <strong>Info Verifikasi Keuangan:</strong> Rekening di bawah ini digunakan secara otomatis oleh sistem Xendit Disbursement untuk mencairkan dana hasil lelang setelah dikurangi komisi.
            </div>

            <div className="panel-form-group">
              <label className="panel-form-label">Rekening Bank &amp; Cabang</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="panel-form-input font-bold"
                required
              />
            </div>

            <div className="panel-form-group">
              <label className="panel-form-label">Atas Nama Rekening (Harus sama dengan SIUP)</label>
              <input
                type="text"
                value={bankOwner}
                onChange={(e) => setBankOwner(e.target.value)}
                className="panel-form-input"
                required
              />
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
