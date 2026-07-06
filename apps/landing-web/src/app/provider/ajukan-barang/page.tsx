"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProviderLayout from "../../../components/layout/ProviderLayout";
import { apiUrl, fetchWithRetry } from "@/lib/api";

const CAR_BRANDS = ['Toyota', 'Honda', 'Daihatsu', 'Suzuki', 'Mitsubishi', 'Nissan', 'Mazda', 'Hyundai', 'Kia', 'Wuling', 'BMW', 'Mercedes-Benz'];
const MOTOR_BRANDS = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Vespa', 'TVS', 'KTM'];

const CAR_MODELS_BY_BRAND: Record<string, string[]> = {
  Toyota: ['Avanza', 'Innova', 'Fortuner', 'Alphard', 'Rush', 'Agya', 'Calya', 'Yaris', 'Camry', 'Vios', 'Corolla'],
  Honda: ['Brio', 'Jazz', 'HR-V', 'CR-V', 'Mobilio', 'BR-V', 'Civic', 'City', 'Accord'],
  Daihatsu: ['Xenia', 'Terios', 'Sigra', 'Ayla', 'Gran Max', 'Luxio', 'Sirion'],
  Suzuki: ['Ertiga', 'XL7', 'Ignis', 'Baleno', 'Carry', 'Jimny', 'S-Cross'],
  Mitsubishi: ['Xpander', 'Pajero Sport', 'Triton', 'L300', 'Outlander'],
  Nissan: ['Grand Livina', 'Serena', 'X-Trail', 'Juke', 'March', 'Kicks'],
  Mazda: ['Mazda2', 'Mazda3', 'CX-3', 'CX-5', 'CX-9'],
  Hyundai: ['Creta', 'Palisade', 'Santa Fe', 'Ioniq 5', 'Kona', 'Stargazer'],
  Kia: ['Sonet', 'Seltos', 'Carnival', 'Picanto', 'Rio'],
  Wuling: ['Confero', 'Cortez', 'Almaz', 'Air EV'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE']
};

const MOTOR_MODELS_BY_BRAND: Record<string, string[]> = {
  Honda: ['Beat', 'Vario', 'Scoopy', 'PCX', 'ADV', 'CBR', 'Supra', 'Revo', 'CB150R', 'CRF150L'],
  Yamaha: ['NMAX', 'Aerox', 'Lexi', 'Mio', 'Fino', 'Vixion', 'R15', 'R25', 'MT-15', 'WR155R', 'Jupiter', 'Vega'],
  Suzuki: ['Satria', 'GSX-R150', 'GSX-S150', 'Nex', 'Address', 'Smash'],
  Kawasaki: ['Ninja 250', 'Ninja ZX-25R', 'KLX 150', 'W175', 'D-Tracker'],
  Vespa: ['Primavera', 'Sprint', 'GTS', 'LX', 'S 125'],
  TVS: ['Callisto', 'Ntorq', 'Apache'],
  KTM: ['Duke 200', 'Duke 250', 'Duke 390', 'RC 200', 'RC 250']
};

const COLORS = ['Hitam', 'Putih', 'Perak (Silver)', 'Abu-abu', 'Merah', 'Biru', 'Hijau', 'Kuning', 'Cokelat', 'Orange'];
const BODY_TYPES = ['Sedan', 'SUV', 'MPV', 'Hatchback', 'Pick Up', 'Truk', 'Bus'];

export default function ProviderAjukanBarang() {
  const initialFormState = {
    category: "mobil",
    title: "", // akan digenerate dari brand + model + year
    description: "",
    base_price: "",
    
    // Spesifikasi Kendaraan
    brand: "",
    model: "",
    color: "",
    fuel_type: "Bensin",
    transmission: "Otomatis",
    body_type: "",
    year: new Date().getFullYear(),
    cylinder: "",
    odometer: "",
    police_number: "",
    bpkb_number: "",
    frame_number: "",
    engine_number: "",

    // Dokumen (Tanggal)
    stnk_date: "",
    stnk_tax_date: "",
    keur_date: "",

    // Dokumen (Fisik - Boolean)
    doc_stnk: false,
    doc_bpkb: false,
    doc_faktur: false,
    doc_kwitansi: false,
    doc_form_a: false,
    doc_copy_ktp: false,
    doc_keur: false,
    doc_sph: false,

    // Foto Aset
    img_depan: null as File | null,
    img_belakang: null as File | null,
    img_kanan: null as File | null,
    img_kiri: null as File | null,
    img_mesin: null as File | null,
    img_interior: null as File | null,
  };

  const [formData, setFormData] = useState<typeof initialFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [auctionType, setAuctionType] = useState("English Auction");
  const [enabledTypes, setEnabledTypes] = useState<string[]>(["English Auction", "Dutch Auction", "Sealed-Bid", "Timed Auction", "Buy Now + Auction", "Group/Bundle"]);
  const [enabledCategories, setEnabledCategories] = useState({ mobil: true, motor: true, properti: false, heavy: false });

  const router = useRouter();

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const cookieMap: Record<string, string> = {};
      document.cookie.split(";").forEach((c) => {
        const parts = c.trim().split("=");
        if (parts[0]) cookieMap[parts[0]] = parts[1] || "";
      });

      const list = [];
      if (cookieMap["feat_auction_english"] !== "false") list.push("English Auction");
      if (cookieMap["feat_auction_dutch"] !== "false") list.push("Dutch Auction");
      if (cookieMap["feat_auction_sealed"] !== "false") list.push("Sealed-Bid");
      if (cookieMap["feat_auction_timed"] !== "false") list.push("Timed Auction");
      if (cookieMap["feat_auction_buynow"] !== "false") list.push("Buy Now + Auction");
      if (cookieMap["feat_auction_group"] !== "false") list.push("Group/Bundle");

      if (list.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEnabledTypes(list);
        setAuctionType(list[0]);
      }

      const cats = {
        mobil: cookieMap["feat_category_mobil"] !== "false",
        motor: cookieMap["feat_category_motor"] !== "false",
        properti: cookieMap["feat_category_properti"] === "true",
        heavy: cookieMap["feat_category_heavy"] === "true",
      };
      setEnabledCategories(cats);

      if (!cats.mobil) {
        if (cats.motor) setFormData((prev) => ({ ...prev, category: "motor" }));
        else if (cats.heavy) setFormData((prev) => ({ ...prev, category: "alat-berat" }));
        else if (cats.properti) setFormData((prev) => ({ ...prev, category: "properti" }));
      }
    }
  }, []);

  const handleChange = (field: string, value: string | number | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getAvailableBrands = () => {
    if (formData.category === 'motor') return MOTOR_BRANDS;
    if (formData.category === 'mobil') return CAR_BRANDS;
    return [];
  };

  const getAvailableModels = () => {
    if (formData.category === 'motor') {
      return formData.brand ? MOTOR_MODELS_BY_BRAND[formData.brand] || [] : [];
    }
    if (formData.category === 'mobil') {
      return formData.brand ? CAR_MODELS_BY_BRAND[formData.brand] || [] : [];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("Sesi Anda telah berakhir, silakan login kembali.");
        router.push("/login");
        return;
      }

      const payload = {
        ...formData,
        title: `${formData.brand} ${formData.model} ${formData.year}`,
        description: `${formData.description}\n\nJenis Lelang: ${auctionType}`,
        cylinder: formData.cylinder ? Number(formData.cylinder) : undefined,
        odometer: formData.odometer ? Number(formData.odometer) : undefined,
        stnk_date: formData.stnk_date ? new Date(formData.stnk_date).toISOString() : undefined,
        stnk_tax_date: formData.stnk_tax_date ? new Date(formData.stnk_tax_date).toISOString() : undefined,
        keur_date: formData.keur_date ? new Date(formData.keur_date).toISOString() : undefined,
        images: "[]" // Mock images for now since form doesn't support uploads
      };

      const response = await fetchWithRetry(apiUrl("/assets"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setIsSuccess(true);
        setFormData(initialFormState);
      } else {
        alert(resData.error?.message || "Gagal mengajukan aset");
      }
    } catch {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCheckbox = (field: string, label: string) => (
    <label className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-slate-50 p-2 rounded-md border border-transparent hover:border-slate-200 transition-colors">
      <input
        type="checkbox"
        checked={formData[field]}
        onChange={(e) => handleChange(field, e.target.checked)}
        className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
      />
      <span className="text-slate-700">{label}</span>
    </label>
  );

  return (
    <ProviderLayout pageTitle="Ajukan Titip Jual Aset">
      <p className="page-subtitle">Ajukan barang atau kendaraan baru untuk masuk antrean kurasi lelang</p>

      <div className="grid-2-1">
        <div>
          {isSuccess && (
            <div className="alert-box success mb-4">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <strong>Pengajuan Berhasil Diajukan!</strong> Aset Anda telah terdaftar dan menunggu proses verifikasi dokumen &amp; fisik oleh tim kurator kami. Status approval dapat dipantau di halaman Inventori.
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header border-b pb-4 mb-4">Form Pengisian Detail Aset</div>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SECTION: DATA DASAR */}
              <div>
                <h3 className="font-semibold text-lg text-primary mb-3">1. Data Dasar</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Kategori Aset</label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        handleChange('category', e.target.value);
                        handleChange('brand', '');
                        handleChange('model', '');
                      }}
                      className="panel-form-select"
                    >
                      {enabledCategories.mobil && <option value="mobil">Mobil</option>}
                      {enabledCategories.motor && <option value="motor">Motor</option>}
                      {enabledCategories.heavy && <option value="alat-berat">Alat Berat</option>}
                      {enabledCategories.properti && <option value="properti">Properti</option>}
                    </select>
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Tahun Pembuatan</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleChange('year', Number(e.target.value))}
                      className="panel-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Merek (Brand)</label>
                    <select 
                      value={formData.brand} 
                      onChange={(e) => {
                        handleChange('brand', e.target.value);
                        handleChange('model', '');
                      }} 
                      className="panel-form-select" 
                      required
                    >
                      <option value="" disabled>Pilih Merek...</option>
                      {getAvailableBrands().map(b => <option key={b} value={b}>{b}</option>)}
                      <option value="Lainnya">Lainnya...</option>
                    </select>
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Model / Tipe Aset</label>
                    {formData.brand && formData.brand !== 'Lainnya' && getAvailableModels().length > 0 ? (
                      <select 
                        value={formData.model} 
                        onChange={(e) => handleChange('model', e.target.value)} 
                        className="panel-form-select" 
                        required
                      >
                        <option value="" disabled>Pilih Model...</option>
                        {getAvailableModels().map(m => <option key={m} value={m}>{m}</option>)}
                        <option value="Lainnya">Lainnya...</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        placeholder="Contoh: Avanza G 1.3 MT"
                        className="panel-form-input"
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Harga Dasar Limit (Min. Penawaran)</label>
                    <input
                      type="text"
                      value={!formData.base_price ? '' : new Intl.NumberFormat('id-ID').format(Number(formData.base_price))}
                      onChange={(e) => handleChange('base_price', Number(e.target.value.replace(/\D/g, '')))}
                      className="panel-form-input"
                      placeholder="Contoh: 100000000"
                      required
                    />
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Jenis Lelang</label>
                    <select
                      value={auctionType}
                      onChange={(e) => setAuctionType(e.target.value)}
                      className="panel-form-select"
                    >
                      {enabledTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="panel-form-group mt-4">
                  <label className="panel-form-label">Deskripsi &amp; Kondisi Fisik Singkat</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Keterangan kondisi mesin, body, dll."
                    className="panel-form-textarea h-24"
                    required
                  />
                </div>
              </div>

              {/* SECTION: SPESIFIKASI KENDARAAN */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-3">2. Spesifikasi Kendaraan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Warna</label>
                    <select value={formData.color} onChange={(e) => handleChange('color', e.target.value)} className="panel-form-select">
                      <option value="">Pilih Warna...</option>
                      {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Transmisi</label>
                    <select value={formData.transmission} onChange={(e) => handleChange('transmission', e.target.value)} className="panel-form-select">
                      <option value="Otomatis">Otomatis</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Bahan Bakar</label>
                    <select value={formData.fuel_type} onChange={(e) => handleChange('fuel_type', e.target.value)} className="panel-form-select">
                      <option value="Bensin">Bensin</option>
                      <option value="Solar">Solar</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="EV">EV (Listrik)</option>
                    </select>
                  </div>
                  {formData.category !== "motor" && (
                    <div className="panel-form-group">
                      <label className="panel-form-label">Tipe Bodi</label>
                      <select value={formData.body_type} onChange={(e) => handleChange('body_type', e.target.value)} className="panel-form-select">
                        <option value="">Pilih Tipe...</option>
                        {BODY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Kapasitas Mesin (CC)</label>
                    <input type="number" value={formData.cylinder} onChange={(e) => handleChange('cylinder', e.target.value)} placeholder="Contoh: 1500" className="panel-form-input" />
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Odometer (KM)</label>
                    <input type="number" value={formData.odometer} onChange={(e) => handleChange('odometer', e.target.value)} placeholder="Contoh: 45000" className="panel-form-input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Nomor Polisi</label>
                    <input type="text" value={formData.police_number} onChange={(e) => handleChange('police_number', e.target.value.toUpperCase())} placeholder="Contoh: B 1234 ABC" className="panel-form-input" />
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Nomor BPKB</label>
                    <input type="text" value={formData.bpkb_number} onChange={(e) => handleChange('bpkb_number', e.target.value)} placeholder="Contoh: K-12345678" className="panel-form-input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Nomor Rangka</label>
                    <input type="text" value={formData.frame_number} onChange={(e) => handleChange('frame_number', e.target.value.toUpperCase())} placeholder="Contoh: MHF..." className="panel-form-input" />
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Nomor Mesin</label>
                    <input type="text" value={formData.engine_number} onChange={(e) => handleChange('engine_number', e.target.value.toUpperCase())} placeholder="Contoh: K3VE..." className="panel-form-input" />
                  </div>
                </div>
              </div>

              {/* SECTION: MASA BERLAKU DOKUMEN */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-3">3. Masa Berlaku Dokumen</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Masa Berlaku STNK</label>
                    <input type="date" value={formData.stnk_date} onChange={(e) => handleChange('stnk_date', e.target.value)} className="panel-form-input" />
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Masa Berlaku Pajak</label>
                    <input type="date" value={formData.stnk_tax_date} onChange={(e) => handleChange('stnk_tax_date', e.target.value)} className="panel-form-input" />
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Masa Berlaku KEUR</label>
                    <input type="date" value={formData.keur_date} onChange={(e) => handleChange('keur_date', e.target.value)} className="panel-form-input" />
                  </div>
                </div>
              </div>

              {/* SECTION: KELENGKAPAN DOKUMEN FISIK */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-3">4. Kelengkapan Dokumen Fisik</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 mb-4">Centang dokumen yang fisik aslinya diserahkan ke balai lelang.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {renderCheckbox('doc_stnk', 'STNK')}
                    {renderCheckbox('doc_bpkb', 'BPKB')}
                    {renderCheckbox('doc_faktur', 'Faktur')}
                    {renderCheckbox('doc_kwitansi', 'Kwitansi Blangko')}
                    {renderCheckbox('doc_form_a', 'Form A')}
                    {renderCheckbox('doc_copy_ktp', 'Fotokopi KTP')}
                    {renderCheckbox('doc_keur', 'Buku KEUR')}
                    {renderCheckbox('doc_sph', 'SPH')}
                  </div>
                </div>
              </div>

              {/* SECTION: FOTO ASET */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-3">5. Foto Aset</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'img_depan', label: 'Foto Depan' },
                    { key: 'img_belakang', label: 'Foto Belakang' },
                    { key: 'img_kanan', label: 'Foto Samping Kanan' },
                    { key: 'img_kiri', label: 'Foto Samping Kiri' },
                    { key: 'img_mesin', label: 'Foto Mesin' },
                    { key: 'img_interior', label: 'Foto Interior' },
                  ].map((item) => (
                    <div key={item.key} className="panel-form-group">
                      <label className="panel-form-label">{item.label}</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleChange(item.key, file);
                        }}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-secondary hover:bg-secondary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengirim Pengajuan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">publish</span>
                      Ajukan Titip Jual
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info panel */}
        <div>
          <div className="card sticky top-24">
            <div className="card-header">Panduan &amp; Syarat Dokumen</div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Untuk mempercepat persetujuan lelang, pastikan Anda melengkapi dokumen berikut saat tim surveyor mengunjungi lokasi penyimpanan unit Anda:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 font-medium text-slate-800">
                <li>BPKB Asli &amp; Fotokopi</li>
                <li>STNK Asli (Pajak Hidup / Mati)</li>
                <li>Faktur Pembelian &amp; Kwitansi Kosong</li>
                <li>KTP Pemilik Sesuai BPKB / Surat Kuasa</li>
              </ul>
              <p>
                Pastikan nomor rangka dan nomor mesin sesuai dengan fisik kendaraan. Unit yang lolos inspeksi fisik minimal grade **C** akan langsung didaftarkan ke jadwal lelang terdekat dalam waktu 24 jam.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
