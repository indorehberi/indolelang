"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProviderLayout from "../../../components/layout/ProviderLayout";
import { apiUrl, fetchWithRetry, apiFetch } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";
import * as XLSX from "xlsx";

const CAR_BRANDS = ['TOYOTA', 'HONDA', 'DAIHATSU', 'SUZUKI', 'MITSUBISHI', 'NISSAN', 'MAZDA', 'HYUNDAI', 'KIA', 'WULING', 'BMW', 'MERCEDES-BENZ', 'FORD', 'BYD', 'CHERY', 'MG', 'NETA', 'AION', 'VINFAST', 'GEELY', 'XPENG', 'DENZA'];
const MOTOR_BRANDS = ['HONDA', 'YAMAHA', 'SUZUKI', 'KAWASAKI', 'VESPA', 'TVS', 'KTM'];

const CAR_MODELS_BY_BRAND: Record<string, string[]> = {
  TOYOTA: ['AVANZA', 'INNOVA', 'FORTUNER', 'ALPHARD', 'RUSH', 'AGYA', 'CALYA', 'YARIS', 'CAMRY', 'VIOS', 'COROLLA'],
  HONDA: ['BRIO', 'JAZZ', 'HR-V', 'CR-V', 'MOBILIO', 'BR-V', 'CIVIC', 'CITY', 'ACCORD'],
  DAIHATSU: ['XENIA', 'TERIOS', 'SIGRA', 'AYLA', 'GRAN MAX', 'LUXIO', 'SIRION'],
  SUZUKI: ['ERTIGA', 'XL7', 'IGNIS', 'BALENO', 'CARRY', 'JIMNY', 'S-CROSS'],
  MITSUBISHI: ['XPANDER', 'PAJERO SPORT', 'TRITON', 'L300', 'OUTLANDER'],
  NISSAN: ['GRAND LIVINA', 'SERENA', 'X-TRAIL', 'JUKE', 'MARCH', 'KICKS'],
  MAZDA: ['MAZDA2', 'MAZDA3', 'CX-3', 'CX-5', 'CX-9'],
  FORD: ['FIESTA', 'ECOSPORT', 'EVEREST', 'RANGER', 'FOCUS'],
  HYUNDAI: ['CRETA', 'PALISADE', 'SANTA FE', 'IONIQ 5', 'KONA', 'STARGAZER'],
  KIA: ['SONET', 'SELTOS', 'CARNIVAL', 'PICANTO', 'RIO'],
  WULING: ['CONFERO', 'CORTEZ', 'ALMAZ', 'AIR EV', 'BINGUOEV', 'CLOUD EV'],
  BMW: ['3 SERIES', '5 SERIES', '7 SERIES', 'X1', 'X3', 'X5'],
  'MERCEDES-BENZ': ['C-CLASS', 'E-CLASS', 'S-CLASS', 'GLC', 'GLE'],
  BYD: ['DOLPHIN', 'ATTO 3', 'SEAL', 'M6'],
  CHERY: ['OMODA E5', 'J6'],
  MG: ['MG4 EV', 'MG ZS EV'],
  NETA: ['V-II', 'X'],
  AION: ['Y PLUS', 'V', 'UT'],
  VINFAST: ['VF 3', 'VF 5'],
  GEELY: ['EX5'],
  XPENG: ['G6', 'X9'],
  DENZA: ['D9']
};

const MOTOR_MODELS_BY_BRAND: Record<string, string[]> = {
  HONDA: ['BEAT', 'VARIO', 'SCOOPY', 'PCX', 'ADV', 'CBR', 'SUPRA', 'REVO', 'CB150R', 'CRF150L'],
  YAMAHA: ['NMAX', 'AEROX', 'LEXI', 'MIO', 'FINO', 'VIXION', 'R15', 'R25', 'MT-15', 'WR155R', 'JUPITER', 'VEGA'],
  SUZUKI: ['SATRIA', 'GSX-R150', 'GSX-S150', 'NEX', 'ADDRESS', 'SMASH'],
  KAWASAKI: ['NINJA 250', 'NINJA ZX-25R', 'KLX 150', 'W175', 'D-TRACKER'],
  VESPA: ['PRIMAVERA', 'SPRINT', 'GTS', 'LX', 'S 125'],
  TVS: ['CALLISTO', 'NTORQ', 'APACHE'],
  KTM: ['DUKE 200', 'DUKE 250', 'DUKE 390', 'RC 200', 'RC 250']
};

const VARIANTS_BY_MODEL: Record<string, string[]> = {
  AVANZA: ['1.3 G', '1.5 G', '1.3 E', 'VELOZ 1.5'],
  INNOVA: ['2.0 G', '2.0 V', '2.4 G', '2.4 V', 'VENTURER', 'ZENIX Q', 'ZENIX V', 'ZENIX G'],
  FORTUNER: ['2.4 G', '2.4 VRZ', '2.7 SRZ', '2.8 VRZ GR SPORT'],
  ALPHARD: ['2.5 G', '2.5 X', '3.5 Q'],
  RUSH: ['1.5 G', '1.5 S TRD', '1.5 GR SPORT'],
  AGYA: ['1.2 G', '1.2 GR SPORT'],
  CALYA: ['1.2 G', '1.2 E'],
  YARIS: ['1.5 G', '1.5 TRD', '1.5 GR SPORT'],
  CAMRY: ['2.5 G', '2.5 V', '2.5 HYBRID'],
  VIOS: ['1.5 G', '1.5 E'],
  COROLLA: ['1.8 ALTIS', 'CROSS HYBRID'],
  BRIO: ['1.2 S', '1.2 E', '1.2 RS'],
  JAZZ: ['1.5 S', '1.5 RS'],
  'HR-V': ['1.5 S', '1.5 E', '1.5 SE', '1.5 TURBO RS'],
  'CR-V': ['2.0 I-VTEC', '1.5 TURBO PRESTIGE', '2.0 RS E:HEV'],
  MOBILIO: ['1.5 S', '1.5 E', '1.5 RS'],
  'BR-V': ['1.5 S', '1.5 E', '1.5 PRESTIGE'],
  CIVIC: ['1.5 TURBO', 'TYPE R', 'RS E:HEV'],
  CITY: ['1.5 E', 'HATCHBACK RS'],
  ACCORD: ['2.4 VTI-L', '1.5 TURBO', '2.0 RS E:HEV'],
  XENIA: ['1.3 X', '1.3 R', '1.5 R'],
  TERIOS: ['1.5 X', '1.5 R', '1.5 R CUSTOM'],
  SIGRA: ['1.0 M', '1.2 X', '1.2 R'],
  AYLA: ['1.0 X', '1.2 R'],
  'GRAN MAX': ['1.3 PICK UP', '1.5 PICK UP', '1.3 BLIND VAN'],
  LUXIO: ['1.5 D', '1.5 X'],
  SIRION: ['1.3 D', '1.3 M'],
  ERTIGA: ['1.4 GL', '1.4 GX', 'HYBRID SS'],
  XL7: ['ZETA', 'BETA', 'ALPHA'],
  IGNIS: ['GL', 'GX'],
  BALENO: ['1.4', 'HATCHBACK'],
  CARRY: ['1.5 PICK UP', 'FUTURA 1.5'],
  JIMNY: ['MT', 'AT'],
  'S-CROSS': ['1.5'],
  XPANDER: ['GLS', 'EXCEED', 'SPORT', 'ULTIMATE', 'CROSS'],
  'PAJERO SPORT': ['GLX', 'EXCEED', 'DAKAR', 'DAKAR ULTIMATE'],
  TRITON: ['HDX', 'GLS', 'EXCEED', 'ULTIMATE'],
  L300: ['PICK UP', 'BOX'],
  OUTLANDER: ['PX', 'GLX', 'PHEV'],
  'GRAND LIVINA': ['1.5 SV', '1.5 XV', '1.5 HIGHWAY STAR'],
  SERENA: ['2.0 HIGHWAY STAR', 'E-POWER'],
  'X-TRAIL': ['2.5', '2.0 HYBRID'],
  JUKE: ['1.5 RX'],
  MARCH: ['1.2', '1.5'],
  KICKS: ['E-POWER'],
  MAZDA2: ['GT', 'R', 'R-SPORT'],
  MAZDA3: ['GT', 'SPEED'],
  'CX-3': ['1.5 SPORT', '2.0 PRO'],
  'CX-5': ['TOURING', 'GRAND TOURING', 'ELITE'],
  'CX-9': ['2.5 TURBO', 'KURO EDITION'],
  FIESTA: ['1.5 TREND', '1.5 SPORT', '1.0 ECOBOOST'],
  ECOSPORT: ['1.5 TREND', '1.5 TITANIUM'],
  EVEREST: ['2.5 XLT', '2.2 TITANIUM', '2.0 TITANIUM'],
  RANGER: ['2.2 XLT', '3.2 WILDTRAK', '2.0 RAPTOR'],
  FOCUS: ['1.6 TREND', '2.0 SPORT'],
  CRETA: ['ACTIVE', 'TREND', 'STYLE', 'PRIME'],
  PALISADE: ['PRIME', 'SIGNATURE'],
  'SANTA FE': ['STYLE', 'PRIME', 'SIGNATURE'],
  'IONIQ 5': ['PRIME STANDARD', 'SIGNATURE STANDARD', 'PRIME LONG RANGE', 'SIGNATURE LONG RANGE'],
  KONA: ['2.0 SIGNATURE', 'ELECTRIC'],
  STARGAZER: ['ACTIVE', 'TREND', 'STYLE', 'PRIME', 'ESSENTIAL'],
  SONET: ['ACTIVE', 'SMART', 'PREMIERE'],
  SELTOS: ['EXP', 'EX', 'GT LINE'],
  CARNIVAL: ['PREMIERE'],
  PICANTO: ['EX', 'GT LINE'],
  RIO: ['EX'],
  CONFERO: ['1.5 S', '1.5 DB', '1.5 C', '1.5 L'],
  CORTEZ: ['1.5 S', '1.5 C', '1.5 L', '1.8 C', '1.8 L'],
  ALMAZ: ['1.5 SMART ENJOY', '1.5 EXCLUSIVE', 'RS PRO', 'HYBRID'],
  'AIR EV': ['LITE', 'STANDARD RANGE', 'LONG RANGE'],
  BINGUOEV: ['333 KM', '410 KM'],
  'CLOUD EV': ['460 KM'],
  '3 SERIES': ['320I SPORT', '320I M SPORT', '330I M SPORT'],
  '5 SERIES': ['520I LUXURY', '530I OPULENCE', '530I M SPORT'],
  '7 SERIES': ['730LI SPORT', '740LI OPULENCE'],
  X1: ['SDRIVE18I XLINE', 'SDRIVE18I M SPORT'],
  X3: ['XDRIVE20I XLINE', 'XDRIVE30I M SPORT'],
  X5: ['XDRIVE40I XLINE', 'XDRIVE40I M SPORT'],
  'C-CLASS': ['C180', 'C200 AVANTGARDE', 'C300 AMG LINE'],
  'E-CLASS': ['E200 AVANTGARDE', 'E300 AMG LINE'],
  'S-CLASS': ['S450 L'],
  GLC: ['GLC200 AMG LINE'],
  GLE: ['GLE450 AMG LINE'],
  DOLPHIN: ['DYNAMIC', 'PREMIUM'],
  'ATTO 3': ['ADVANCED', 'SUPERIOR'],
  SEAL: ['PREMIUM', 'PERFORMANCE'],
  M6: ['STANDARD', 'SUPERIOR'],
  'OMODA E5': ['STANDARD', 'PURE'],
  J6: ['FWD', 'AWD'],
  'MG4 EV': ['IGNITE', 'MAGNIFY'],
  'MG ZS EV': ['IGNITE', 'MAGNIFY'],
  'V-II': ['STANDARD'],
  X: ['ELITE', 'SUPREME'],
  'Y PLUS': ['EXCLUSIVE', 'PREMIUM'],
  V: ['ELITE'],
  UT: ['STANDARD'],
  'VF 3': ['STANDARD'],
  'VF 5': ['PLUS'],
  EX5: ['STANDARD'],
  G6: ['STANDARD', 'LONG RANGE'],
  X9: ['STANDARD', 'LONG RANGE'],
  D9: ['PREMIUM'],
  BEAT: ['CBS', 'CBS ISS', 'DELUXE', 'STREET'],
  VARIO: ['125 CBS', '150 EXCLUSIVE', '160 ABS'],
  SCOOPY: ['SPORTY', 'STYLISH', 'PRESTIGE'],
  PCX: ['150 ABS', '160 CBS', '160 ABS'],
  ADV: ['150', '160'],
  CBR: ['150R', '250RR'],
  SUPRA: ['X 125', 'GTR 150'],
  REVO: ['FIT', 'X'],
  CB150R: ['STREETFIRE'],
  CRF150L: ['STANDARD'],
  NMAX: ['155 STANDARD', '155 CONNECTED ABS'],
  AEROX: ['155 STANDARD', '155 CONNECTED ABS'],
  LEXI: ['125', 'LX 155'],
  MIO: ['M3', 'GEAR 125'],
  FINO: ['125 PREMIUM', '125 SPORTY'],
  VIXION: ['150', 'R 155'],
  R15: ['STANDARD', 'M'],
  R25: ['STANDARD', 'ABS'],
  'MT-15': ['STANDARD'],
  WR155R: ['STANDARD'],
  JUPITER: ['Z1', 'MX KING 150'],
  VEGA: ['FORCE'],
  SATRIA: ['F150'],
  'GSX-R150': ['STANDARD', 'KEYLESS'],
  'GSX-S150': ['STANDARD'],
  NEX: ['II', 'CROSS'],
  ADDRESS: ['STANDARD', 'PLAYFUL'],
  SMASH: ['FI'],
  'NINJA 250': ['STANDARD', 'ABS SE'],
  'NINJA ZX-25R': ['STANDARD', 'ABS SE'],
  'KLX 150': ['STANDARD', 'L', 'S', 'BF'],
  W175: ['STANDARD', 'CAFE', 'TR'],
  'D-TRACKER': ['STANDARD', 'SE'],
  PRIMAVERA: ['STANDARD', 'S'],
  SPRINT: ['STANDARD', 'S'],
  GTS: ['SUPER', 'SUPER SPORT', 'CLASSIC'],
  LX: ['I-GET'],
  'S 125': ['I-GET'],
  CALLISTO: ['STANDARD', 'INTELIGO'],
  NTORQ: ['RACE EDITION', 'XP'],
  APACHE: ['RTR 160', 'RTR 200'],
  'DUKE 200': ['STANDARD'],
  'DUKE 250': ['STANDARD'],
  'DUKE 390': ['STANDARD'],
  'RC 200': ['STANDARD'],
  'RC 250': ['STANDARD']
};

const COLORS = ['N/A', 'HITAM', 'PUTIH', 'PERAK (SILVER)', 'ABU-ABU', 'MERAH', 'BIRU', 'HIJAU', 'KUNING', 'COKELAT', 'ORANGE', 'LAINNYA'];
const BODY_TYPES = ['N/A', 'SEDAN', 'SUV', 'MPV', 'HATCHBACK', 'PICK UP', 'TRUK', 'BUS', 'LAINNYA'];

interface Branch {
  id: string;
  name: string;
  city: string;
}

const PHOTO_FIELDS = [
  { key: "photo_front", label: "Foto Depan" },
  { key: "photo_back", label: "Foto Belakang" },
  { key: "photo_right", label: "Foto Samping Kanan" },
  { key: "photo_left", label: "Foto Samping Kiri" },
  { key: "photo_engine", label: "Foto Mesin" },
  { key: "photo_interior", label: "Foto Interior" },
  { key: "photo_stnk", label: "Foto STNK" },
] as const;

function ProviderAjukanBarangContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const initialFormState = {
    category: "mobil",
    title: "", // akan digenerate dari brand + model + year
    description: "",
    base_price: "",
    branch_id: "",
    pool_status: "in_pool",
    notes: "",

    // Spesifikasi Kendaraan
    brand: "",
    model: "",
    type: "",
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

    // Foto Barang (URL setelah diunggah)
    photo_front: "",
    photo_back: "",
    photo_right: "",
    photo_left: "",
    photo_engine: "",
    photo_interior: "",
    photo_stnk: "",
  };

  const [formData, setFormData] = useState<typeof initialFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Bulk import states
  const [importedAssets, setImportedAssets] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [rowUploadingPhoto, setRowUploadingPhoto] = useState<{ index: number; field: string } | null>(null);
  const [managingPhotoIndex, setManagingPhotoIndex] = useState<number | null>(null);

  const countUploadedPhotos = (asset: any) => {
    return PHOTO_FIELDS.filter(f => asset[f.key]).length;
  };

  const handleRowPhotoUpload = async (index: number, field: string, file: File | null) => {
    if (!file) return;
    setRowUploadingPhoto({ index, field });
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const response = await apiFetch("/upload/single", {
        method: "POST",
        body: uploadData,
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setImportedAssets(prev => prev.map((asset, i) => {
          if (i === index) {
            return { ...asset, [field]: resData.data.url };
          }
          return asset;
        }));
        toast.success(`Foto berhasil diunggah!`);
      } else {
        toast.error(resData.error?.message || "Gagal mengunggah foto.");
      }
    } catch (err) {
      toast.error("Koneksi gagal saat mengunggah foto.");
    } finally {
      setRowUploadingPhoto(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        
        // Find the correct sheet name (prioritize names with "aset" or "import", and exclude "Data_Lists")
        let sheetName = workbook.SheetNames.find(n => n && (n.toLowerCase().includes("aset") || n.toLowerCase().includes("import")));
        if (!sheetName) {
          sheetName = workbook.SheetNames.find(n => n !== "Data_Lists") || workbook.SheetNames[0];
        }

        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const findVal = (row: any, ...possibleKeys: string[]) => {
          for (const pk of possibleKeys) {
            const match = Object.keys(row).find(k => 
              k.trim().toLowerCase().replace(/\s+/g, "") === pk.toLowerCase().replace(/\s+/g, "")
            );
            if (match && row[match] !== undefined && row[match] !== null) {
              return row[match];
            }
          }
          return undefined;
        };

        const parsedAssets = rows
          .filter((row: any) => {
            const police = String(findVal(row, "No. Polisi", "police_number") || "").trim();
            const bpkb = String(findVal(row, "No. BPKB", "bpkb_number") || "").trim();
            const brand = String(findVal(row, "Merek", "brand") || "").trim();
            const model = String(findVal(row, "Model", "model") || "").trim();
            
            // Skip example row only if it is exactly the unmodified example row
            const isDefaultExample = 
              brand.toUpperCase() === "TOYOTA" && 
              model.toUpperCase() === "AVANZA" && 
              police === "B 1234 ABC" && 
              bpkb === "BPKB-998877";
              
            if (isDefaultExample) return false;
            
            return brand !== "" || model !== "";
          })
          .map((row: any) => {
            const categoryInput = String(findVal(row, "Kategori (mobil/motor)", "category") || "mobil").trim().toLowerCase();
            const category = categoryInput.includes("motor") ? "motor" : "mobil";
            const branchInput = String(findVal(row, "Cabang", "branch") || "").trim();
            const foundBranch = branches.find(b => 
              b.name.toLowerCase().includes(branchInput.toLowerCase()) || 
              b.city.toLowerCase().includes(branchInput.toLowerCase())
            );

            const parseBool = (val: any) => String(val || "").trim().toLowerCase() === "ada";
            const parseDate = (val: any) => {
              if (!val) return undefined;
              if (val instanceof Date) return val.toISOString().split("T")[0];
              return String(val).trim();
            };

            return {
              category,
              brand: String(findVal(row, "Merek", "brand") || "").trim().toUpperCase(),
              model: String(findVal(row, "Model", "model") || "").trim().toUpperCase(),
              type: String(findVal(row, "Tipe / Varian", "Tipe/Varian", "type") || "").trim().toUpperCase(),
              year: parseInt(findVal(row, "Tahun Pembuatan", "year") || new Date().getFullYear(), 10),
              police_number: String(findVal(row, "No. Polisi", "police_number") || "").trim().toUpperCase(),
              base_price: parseFloat(String(findVal(row, "Harga Dasar Limit", "base_price") || "0").replace(/[^0-9.-]+/g, "")),
              branch_id: foundBranch ? foundBranch.id : undefined,
              branch_name: foundBranch ? foundBranch.name : branchInput || "-",
              pool_status: String(findVal(row, "Status Pool (in_pool/out_pool)", "pool_status") || "in_pool").trim().toLowerCase() === "out_pool" ? "out_pool" : "in_pool",
              color: String(findVal(row, "Warna", "color") || "N/A").trim().toUpperCase(),
              fuel_type: String(findVal(row, "Bahan Bakar", "fuel_type") || "Bensin").trim(),
              transmission: String(findVal(row, "Transmisi", "transmission") || "Otomatis").trim(),
              body_type: String(findVal(row, "Bentuk Bodi", "body_type") || "N/A").trim().toUpperCase(),
              cylinder: findVal(row, "Isi Silinder (cc)", "cylinder") ? parseInt(findVal(row, "Isi Silinder (cc)", "cylinder"), 10) : undefined,
              odometer: findVal(row, "Odometer (km)", "odometer") ? parseInt(findVal(row, "Odometer (km)", "odometer"), 10) : undefined,
              bpkb_number: String(findVal(row, "No. BPKB", "bpkb_number") || "").trim().toUpperCase(),
              frame_number: String(findVal(row, "No. Rangka", "frame_number") || "").trim().toUpperCase(),
              engine_number: String(findVal(row, "No. Mesin", "engine_number") || "").trim().toUpperCase(),
              notes: String(findVal(row, "Catatan / Kondisi", "notes") || "").trim(),
              doc_stnk: parseBool(findVal(row, "Ada STNK?", "doc_stnk")),
              stnk_date: parseDate(findVal(row, "Masa Berlaku STNK (YYYY-MM-DD)", "stnk_date")),
              doc_bpkb: parseBool(findVal(row, "Ada BPKB?", "doc_bpkb")),
              doc_faktur: parseBool(findVal(row, "Ada Faktur?", "doc_faktur")),
              doc_kwitansi: parseBool(findVal(row, "Ada Kwitansi?", "doc_kwitansi")),
              doc_form_a: parseBool(findVal(row, "Ada Form A?", "doc_form_a")),
              doc_copy_ktp: parseBool(findVal(row, "Ada Copy KTP?", "doc_copy_ktp")),
              doc_keur: parseBool(findVal(row, "Ada KEUR?", "doc_keur")),
              keur_date: parseDate(findVal(row, "Masa Berlaku KEUR (YYYY-MM-DD)", "keur_date")),
              doc_sph: parseBool(findVal(row, "Ada SPH?", "doc_sph")),
              photo_front: "",
              photo_back: "",
              photo_right: "",
              photo_left: "",
              photo_engine: "",
              photo_interior: "",
              photo_stnk: "",
            };
          });

        if (parsedAssets.length === 0) {
          const firstRow = rows[0] ? JSON.stringify(rows[0]).substring(0, 120) : "Kosong";
          toast.error(`Tidak ada data aset valid yang ditemukan dalam sheet "${sheetName}". Baris pertama terbaca: ${firstRow}`);
        } else {
          setImportedAssets(parsedAssets);
          toast.success(`Berhasil mengimpor ${parsedAssets.length} aset ke daftar pratinjau.`);
        }
      } catch (err) {
        console.error("Error parsing Excel:", err);
        toast.error("Gagal membaca file Excel. Pastikan format file sesuai.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleBulkSubmit = async () => {
    if (importedAssets.length === 0) return;
    setIsSubmitting(true);
    setImportProgress({ current: 0, total: importedAssets.length });
    
    let successCount = 0;
    let failedCount = 0;
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Sesi Anda telah berakhir, silakan login kembali.");
      router.push("/login");
      setIsSubmitting(false);
      return;
    }

    for (let i = 0; i < importedAssets.length; i++) {
      const asset = importedAssets[i];
      setImportProgress({ current: i + 1, total: importedAssets.length });
      
      try {
        const payload = {
          ...asset,
          title: `${asset.brand} ${asset.model} ${asset.year}`,
          description: asset.notes || `Unit titipan ${asset.brand} ${asset.model}`,
        };

        const res = await apiFetch("/assets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        
        const resData = await res.json();
        if (res.ok && resData.success) {
          successCount++;
        } else {
          console.error(`Failed to import asset ${asset.police_number}:`, resData.error);
          failedCount++;
        }
      } catch (err) {
        console.error(`Error importing asset ${asset.police_number}:`, err);
        failedCount++;
      }
    }
    
    setIsSubmitting(false);
    if (successCount > 0) {
      toast.success(`Berhasil mengajukan ${successCount} aset baru.`);
    }
    if (failedCount > 0) {
      toast.error(`Gagal mengajukan ${failedCount} aset.`);
    }
    
    setImportedAssets([]);
  };

  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [customTypesVariant, setCustomTypesVariant] = useState<string[]>([]);
  const [customTypes, setCustomTypes] = useState<string[]>(BODY_TYPES);
  const [customColors, setCustomColors] = useState<string[]>(COLORS);

  const handleAddBrand = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Merek Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customBrands.includes(trimmed)) setCustomBrands(prev => [...prev, trimmed]);
      handleChange('brand', trimmed);
      handleChange('model', '');
    }
  };

  const handleAddModel = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Model Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customModels.includes(trimmed)) setCustomModels(prev => [...prev, trimmed]);
      handleChange('model', trimmed);
    }
  };

  const handleAddTypeVariant = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Tipe Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customTypesVariant.includes(trimmed)) setCustomTypesVariant(prev => [...prev, trimmed]);
      handleChange('type', trimmed);
    }
  };

  const handleAddType = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Bentuk Bodi Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customTypes.includes(trimmed)) setCustomTypes(prev => [...prev, trimmed]);
      handleChange('body_type', trimmed);
    }
  };

  const handleAddColor = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Warna Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customColors.includes(trimmed)) setCustomColors(prev => [...prev, trimmed]);
      handleChange('color', trimmed);
    }
  };

  const [auctionType, setAuctionType] = useState("English Auction");
  const [enabledTypes, setEnabledTypes] = useState<string[]>(["English Auction", "Dutch Auction", "Sealed-Bid", "Timed Auction", "Buy Now + Auction", "Group/Bundle"]);
  const [enabledCategories, setEnabledCategories] = useState({ mobil: true, motor: true, properti: false, heavy: false });

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const checkProviderStatus = async () => {
      try {
        const res = await apiFetch("/providers/me");
        if (res.ok) {
          const data = (await res.json()).data;
          if (data) {
            if (data.status !== "aktif") {
              toast.error("Akun Anda belum aktif/terverifikasi. Anda belum bisa mengajukan titip jual.");
              router.push("/provider/status");
            }
          } else {
            toast.error("Anda harus terdaftar sebagai provider terlebih dahulu.");
            router.push("/pilih-peran");
          }
        } else {
          toast.error("Gagal memeriksa status akun Anda.");
          router.push("/login");
        }
      } catch (err) {
        console.error("Gagal memeriksa status provider", err);
      }
    };
    checkProviderStatus();
  }, [router, toast]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetchWithRetry(apiUrl("/branches?is_active=true"));
        const resData = await res.json();
        if (res.ok && resData.success) {
          setBranches(resData.data || []);
        }
      } catch (err) {
        console.error("Gagal memuat daftar cabang", err);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!editId) return;

    const fetchAssetForEdit = async () => {
      try {
        const res = await apiFetch(`/assets/${editId}`);
        const resData = await res.json();
        if (res.ok && resData.success) {
          const a = resData.data;
          setFormData((prev) => ({
            ...prev,
            category: a.category ?? prev.category,
            description: (a.description || "").split("\n\nJenis Lelang:")[0],
            base_price: a.base_price ?? prev.base_price,
            branch_id: a.branch_id || "",
            pool_status: a.pool_status || "in_pool",
            notes: a.notes || "",
            brand: (a.brand || "").toUpperCase(),
            model: (a.model || "").toUpperCase(),
            type: (a.type || "").toUpperCase(),
            color: (a.color || "").toUpperCase(),
            fuel_type: (a.fuel_type || "BENSIN").toUpperCase(),
            transmission: (a.transmission || "OTOMATIS").toUpperCase(),
            body_type: (a.body_type || "").toUpperCase(),
            year: a.year || prev.year,
            cylinder: a.cylinder ? String(a.cylinder) : "",
            odometer: a.odometer ? String(a.odometer) : "",
            police_number: (a.police_number || "").toUpperCase(),
            bpkb_number: (a.bpkb_number || "").toUpperCase(),
            frame_number: (a.frame_number || "").toUpperCase(),
            engine_number: (a.engine_number || "").toUpperCase(),
            stnk_date: a.stnk_date ? a.stnk_date.slice(0, 10) : "",
            stnk_tax_date: a.stnk_tax_date ? a.stnk_tax_date.slice(0, 10) : "",
            keur_date: a.keur_date ? a.keur_date.slice(0, 10) : "",
            doc_stnk: !!a.doc_stnk,
            doc_bpkb: !!a.doc_bpkb,
            doc_faktur: !!a.doc_faktur,
            doc_kwitansi: !!a.doc_kwitansi,
            doc_form_a: !!a.doc_form_a,
            doc_copy_ktp: !!a.doc_copy_ktp,
            doc_keur: !!a.doc_keur,
            doc_sph: !!a.doc_sph,
            photo_front: a.photo_front || "",
            photo_back: a.photo_back || "",
            photo_right: a.photo_right || "",
            photo_left: a.photo_left || "",
            photo_engine: a.photo_engine || "",
            photo_interior: a.photo_interior || "",
            photo_stnk: a.photo_stnk || "",
          }));

          // Prefill custom option lists if they are not in defaults
          if (a.brand) {
            const upBrand = a.brand.toUpperCase();
            if (!CAR_BRANDS.includes(upBrand) && !MOTOR_BRANDS.includes(upBrand)) {
              setCustomBrands((prev) => [...new Set([...prev, upBrand])]);
            }
          }
          if (a.model) {
            setCustomModels((prev) => [...new Set([...prev, a.model.toUpperCase()])]);
          }
          if (a.type) {
            setCustomTypesVariant((prev) => [...new Set([...prev, a.type.toUpperCase()])]);
          }
          if (a.body_type) {
            const upBody = a.body_type.toUpperCase();
            if (!BODY_TYPES.includes(upBody)) {
              setCustomTypes((prev) => [...new Set([...prev, upBody])]);
            }
          }
          if (a.color) {
            const upColor = a.color.toUpperCase();
            if (!COLORS.includes(upColor)) {
              setCustomColors((prev) => [...new Set([...prev, upColor])]);
            }
          }
        } else {
          toast.error("Gagal memuat data barang untuk diedit.");
          router.push("/provider/daftar-barang");
        }
      } catch (err) {
        console.error("Gagal memuat data barang", err);
      }
    };

    fetchAssetForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handlePhotoUpload = async (field: string, file: File | null) => {
    if (!file) return;
    setUploadingPhoto(field);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const response = await apiFetch("/upload/single", {
        method: "POST",
        body: uploadData,
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        handleChange(field, resData.data.url);
      } else {
        toast.error(resData.error?.message || "Gagal mengunggah foto.");
      }
    } catch (err) {
      toast.error("Koneksi gagal saat mengunggah foto.");
    } finally {
      setUploadingPhoto(null);
    }
  };

  React.useEffect(() => {
    const fetchPlatformSettings = async () => {
      try {
        const response = await fetchWithRetry(apiUrl("/public/settings"));
        const data = await response.json();
        
        let settingsMap: Record<string, string> = {};
        if (response.ok && data.success) {
          settingsMap = data.data || {};
        } else {
          // Fallback to cookies if API fails
          if (typeof document !== "undefined") {
            document.cookie.split(";").forEach((c) => {
              const parts = c.trim().split("=");
              if (parts[0]) settingsMap[parts[0]] = parts[1] || "";
            });
          }
        }

        const list = [];
        if (settingsMap["feat_auction_english"] !== "false") list.push("English Auction");
        if (settingsMap["feat_auction_dutch"] === "true") list.push("Dutch Auction");
        if (settingsMap["feat_auction_sealed"] === "true") list.push("Sealed-Bid");
        if (settingsMap["feat_auction_timed"] === "true") list.push("Timed Auction");
        if (settingsMap["feat_auction_buynow"] === "true") list.push("Buy Now + Auction");
        if (settingsMap["feat_auction_group"] === "true") list.push("Group/Bundle");

        if (list.length > 0) {
          setEnabledTypes(list);
          if (!editId) setAuctionType(list[0]);
        }

        const cats = {
          mobil: settingsMap["feat_category_mobil"] !== "false",
          motor: settingsMap["feat_category_motor"] !== "false",
          properti: settingsMap["feat_category_properti"] === "true",
          heavy: settingsMap["feat_category_heavy"] === "true",
        };
        setEnabledCategories(cats);

        if (!cats.mobil) {
          if (cats.motor) setFormData((prev) => ({ ...prev, category: "motor" }));
          else if (cats.heavy) setFormData((prev) => ({ ...prev, category: "alat-berat" }));
          else if (cats.properti) setFormData((prev) => ({ ...prev, category: "properti" }));
        }
      } catch (err) {
        console.error("Gagal mengambil pengaturan platform", err);
      }
    };
    
    fetchPlatformSettings();
  }, [editId]);

  const handleChange = (field: string, value: string | number | boolean | File | null) => {
    let finalValue = value;
    if (
      typeof value === 'string' &&
      [
        'brand',
        'model',
        'type',
        'body_type',
        'color',
        'transmission',
        'fuel_type',
        'police_number',
        'bpkb_number',
        'frame_number',
        'engine_number'
      ].includes(field)
    ) {
      finalValue = value.toUpperCase();
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
  };

  const getAvailableBrands = () => {
    let brands: string[] = [];
    if (formData.category === 'motor') brands = MOTOR_BRANDS;
    else if (formData.category === 'mobil') brands = CAR_BRANDS;
    return brands.map(b => b.toUpperCase());
  };

  const getAvailableModels = () => {
    if (!formData.brand || formData.brand === 'N/A' || formData.brand === 'LAINNYA') {
      return [];
    }
    let models: string[] = [];
    if (formData.category === 'motor') {
      models = MOTOR_MODELS_BY_BRAND[formData.brand] || [];
    } else if (formData.category === 'mobil') {
      models = CAR_MODELS_BY_BRAND[formData.brand] || [];
    }
    return models.map(m => m.toUpperCase());
  };

  const getAvailableTypes = () => {
    if (!formData.model || formData.model === 'N/A' || formData.model === 'LAINNYA') {
      return [];
    }
    const vars = VARIANTS_BY_MODEL[formData.model.toUpperCase()] || [];
    return vars.map(v => v.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Sesi Anda telah berakhir, silakan login kembali.");
        router.push("/login");
        return;
      }

      const payload = {
        ...formData,
        title: `${formData.brand} ${formData.model} ${formData.year}`,
        description: formData.description,
        type: formData.type || undefined,
        // Cabang is optional now — send undefined rather than "" when left
        // unselected, since the backend's uuid validation rejects an empty
        // string as an invalid uuid (it only treats undefined as "not set").
        branch_id: formData.branch_id || undefined,
        cylinder: formData.cylinder && formData.cylinder !== "N/A" && formData.cylinder !== "n/a" ? Number(formData.cylinder) : undefined,
        odometer: formData.odometer && formData.odometer !== "N/A" && formData.odometer !== "n/a" ? Number(formData.odometer) : undefined,
        stnk_date: formData.stnk_date ? new Date(formData.stnk_date).toISOString() : undefined,
        stnk_tax_date: formData.stnk_tax_date ? new Date(formData.stnk_tax_date).toISOString() : undefined,
        keur_date: formData.keur_date ? new Date(formData.keur_date).toISOString() : undefined,
      };

      const response = await apiFetch(editId ? `/assets/${editId}` : "/assets", {
        method: editId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        if (editId) {
          toast.success("Perubahan berhasil disimpan.");
          router.push("/provider/daftar-barang");
        } else {
          setIsSuccess(true);
          setFormData(initialFormState);
        }
      } else {
        toast.error(resData.error?.message || "Gagal mengajukan Barang");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCheckbox = (field: keyof typeof formData, label: string) => (
    <label className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-slate-50 p-2 rounded-md border border-transparent hover:border-slate-200 transition-colors">
      <input
        type="checkbox"
        checked={!!formData[field]}
        onChange={(e) => handleChange(field as string, e.target.checked)}
        className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
      />
      <span className="text-slate-700">{label}</span>
    </label>
  );

  return (
    <ProviderLayout pageTitle={editId ? "Edit Titip Jual Unit" : "Ajukan Titip Jual Unit"}>
      <p className="page-subtitle">
        {editId ? "Perbarui data pengajuan yang ditolak, lalu ajukan kembali dari halaman Daftar Unit" : "Ajukan Unit baru untuk masuk antrean kurasi lelang"}
      </p>

      <div className="grid-2-1">
        <div>
          {/* CARD 1: IMPORT MASSAL */}
          {!editId && (
            <div className="card mb-6">
              <div className="card-header border-b pb-4 mb-4 flex justify-between items-center flex-wrap gap-2">
                <span className="font-bold text-slate-800">Import Aset via Excel</span>
                <a
                  href="/api/template-import"
                  download="template_import_aset.xlsx"
                  className="px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download Template Excel
                </a>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Anda dapat mengimpor banyak unit sekaligus menggunakan file spreadsheet Excel. Unduh template di atas, isi data aset, lalu unggah kembali di bawah ini. Pilihan dropdown pada Excel sudah disesuaikan dengan form pengajuan.
                </p>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-slate-50/50">
                  <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">upload_file</span>
                  <p className="text-xs text-slate-500 mb-3">Pilih berkas template Excel yang sudah diisi (.xlsx)</p>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload-input"
                  />
                  <label
                    htmlFor="excel-upload-input"
                    className="inline-flex px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    Pilih File Excel
                  </label>
                </div>

                {importedAssets.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center justify-between">
                      <span>Daftar Pratinjau Aset yang Akan Diimport ({importedAssets.length} unit)</span>
                      <button
                        onClick={() => setImportedAssets([])}
                        className="text-xs text-red-500 hover:underline font-bold"
                      >
                        Batal Semua
                      </button>
                    </h4>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px]">
                      <table className="w-full text-left border-collapse" style={{ fontSize: "0.85rem" }}>
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-3 font-bold text-slate-700 w-12 text-center">No</th>
                            <th className="p-3 font-bold text-slate-700">No. Polisi</th>
                            <th className="p-3 font-bold text-slate-700">Nama Kendaraan</th>
                            <th className="p-3 font-bold text-slate-700">Harga Dasar</th>
                            <th className="p-3 font-bold text-slate-700">Cabang</th>
                            <th className="p-3 font-bold text-slate-700">Status Pool</th>
                            <th className="p-3 font-bold text-slate-700 text-center">Foto Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {importedAssets.map((asset, index) => (
                            <tr key={index}>
                              <td className="p-3 text-center text-slate-500">{index + 1}</td>
                              <td className="p-3 font-bold text-slate-800">{asset.police_number || "-"}</td>
                              <td className="p-3 text-slate-700">{asset.brand} {asset.model} ({asset.year})</td>
                              <td className="p-3 text-slate-700 font-bold">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(asset.base_price)}</td>
                              <td className="p-3 text-slate-700">{asset.branch_name}</td>
                              <td className="p-3 text-slate-700 capitalize">{asset.pool_status}</td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setManagingPhotoIndex(index)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1 mx-auto transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                                  <span>Kelola Foto ({countUploadedPhotos(asset)}/7)</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={handleBulkSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-secondary hover:bg-secondary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-4 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Memproses Pengajuan {importProgress.current} dari {importProgress.total}...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">publish</span>
                            <span>Ajukan Aset</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {managingPhotoIndex !== null && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col scale-in duration-200">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Import Excel - Kelola Foto</span>
                    <h3 className="text-lg font-black text-slate-800 mt-1">
                      Upload Foto: {importedAssets[managingPhotoIndex]?.brand} {importedAssets[managingPhotoIndex]?.model} ({importedAssets[managingPhotoIndex]?.year})
                    </h3>
                  </div>
                  <button
                    onClick={() => setManagingPhotoIndex(null)}
                    className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  {PHOTO_FIELDS.map((item) => {
                    const url = importedAssets[managingPhotoIndex]?.[item.key];
                    const isUploading = rowUploadingPhoto?.index === managingPhotoIndex && rowUploadingPhoto?.field === item.key;
                    
                    return (
                      <div key={item.key} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <label className="font-bold text-xs text-slate-700 block mb-1">{item.label}</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleRowPhotoUpload(managingPhotoIndex, item.key, e.target.files?.[0] || null)}
                            disabled={isUploading}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                          />
                          {isUploading && (
                            <span className="text-[10px] text-slate-500 mt-1 block animate-pulse">Mengunggah foto...</span>
                          )}
                          {url && !isUploading && (
                            <span className="text-[10px] text-success font-bold mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Foto berhasil tersimpan
                            </span>
                          )}
                        </div>

                        {url && !isUploading && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={item.label} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setImportedAssets(prev => prev.map((asset, i) => {
                                  if (i === managingPhotoIndex) {
                                    return { ...asset, [item.key]: "" };
                                  }
                                  return asset;
                                }));
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 font-bold transition-opacity"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                  <button
                    type="button"
                    onClick={() => setManagingPhotoIndex(null)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Selesai &amp; Simpan
                  </button>
                </div>
              </div>
            </div>
          )}



          {isSuccess && (
            <div className="alert-box success mb-4">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <strong>Pengajuan Berhasil Diajukan!</strong> Unit Anda telah terdaftar dan menunggu proses verifikasi dokumen &amp; fisik oleh tim kurator kami. Status approval dapat dipantau di halaman Inventori.
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header border-b pb-4 mb-4">Form Pengisian Detail Unit</div>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SECTION: DATA DASAR */}
              <div>
                <h3 className="font-semibold text-lg text-primary mb-3">1. Data Dasar</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Kategori Unit</label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        handleChange('category', e.target.value);
                        handleChange('brand', '');
                        handleChange('model', '');
                      }}
                      className="panel-form-select"
                    >
                      {enabledCategories.mobil && <option value="mobil">MOBIL</option>}
                      {enabledCategories.motor && <option value="motor">MOTOR</option>}
                      {enabledCategories.heavy && <option value="alat-berat">ALAT BERAT</option>}
                      {enabledCategories.properti && <option value="properti">PROPERTI</option>}
                      <option value="N/A">N/A</option>
                      <option value="LAINNYA">LAINNYA</option>
                    </select>
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Tahun Pembuatan</label>
                    <input
                      type="text"
                      value={formData.year}
                      onChange={(e) => handleChange('year', e.target.value)}
                      className="panel-form-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="panel-form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="panel-form-label mb-0">Merek (Brand)</label>
                      <button type="button" onClick={() => handleAddBrand()} className="text-xs text-primary font-bold hover:underline">+ Tambahkan</button>
                    </div>
                    <select 
                      value={formData.brand} 
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          handleAddBrand();
                        } else {
                          handleChange('brand', e.target.value.toUpperCase());
                          handleChange('model', '');
                        }
                      }} 
                      className="panel-form-select" 
                    >
                      <option value="" disabled>Pilih Merek...</option>
                      {Array.from(new Set(['N/A', ...getAvailableBrands(), ...customBrands, 'LAINNYA'])).map(b => (
                        <option key={b} value={b.toUpperCase()}>{b.toUpperCase()}</option>
                      ))}
                      <option value="__ADD_NEW__">+ Tambahkan Merek Baru...</option>
                    </select>
                  </div>

                  <div className="panel-form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="panel-form-label mb-0">Model</label>
                      <button type="button" onClick={() => handleAddModel()} className="text-xs text-primary font-bold hover:underline">+ Tambahkan</button>
                    </div>
                    <select 
                      value={formData.model} 
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          handleAddModel();
                        } else {
                          handleChange('model', e.target.value.toUpperCase());
                          handleChange('type', '');
                        }
                      }} 
                      className="panel-form-select" 
                    >
                      <option value="" disabled>Pilih Model...</option>
                      {Array.from(new Set(['N/A', ...getAvailableModels(), ...customModels, 'LAINNYA'])).map(m => (
                        <option key={m} value={m.toUpperCase()}>{m.toUpperCase()}</option>
                      ))}
                      <option value="__ADD_NEW__">+ Tambahkan Model Baru...</option>
                    </select>
                  </div>

                  <div className="panel-form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="panel-form-label mb-0">Tipe</label>
                      <button type="button" onClick={() => handleAddTypeVariant()} className="text-xs text-primary font-bold hover:underline">+ Tambahkan</button>
                    </div>
                    <select 
                      value={formData.type} 
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          handleAddTypeVariant();
                        } else {
                          handleChange('type', e.target.value.toUpperCase());
                        }
                      }} 
                      className="panel-form-select" 
                    >
                      <option value="" disabled>Pilih Tipe...</option>
                      {Array.from(new Set(['N/A', ...getAvailableTypes(), ...customTypesVariant, 'LAINNYA'])).map(t => (
                        <option key={t} value={t.toUpperCase()}>{t.toUpperCase()}</option>
                      ))}
                      <option value="__ADD_NEW__">+ Tambahkan Tipe Baru...</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="panel-form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="panel-form-label mb-0">Bentuk Bodi</label>
                      <button type="button" onClick={() => handleAddType()} className="text-xs text-primary font-bold hover:underline">+ Tambahkan</button>
                    </div>
                    <select 
                      value={formData.body_type} 
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          handleAddType();
                        } else {
                          handleChange('body_type', e.target.value.toUpperCase());
                        }
                      }} 
                      className="panel-form-select"
                    >
                      <option value="">Pilih Tipe...</option>
                      {customTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                      <option value="__ADD_NEW__">+ Tambahkan Tipe Baru...</option>
                    </select>
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

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Cabang</label>
                    <select
                      value={formData.branch_id}
                      onChange={(e) => handleChange('branch_id', e.target.value)}
                      className="panel-form-select"
                    >
                      <option value="" disabled>Pilih Cabang...</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                      ))}
                    </select>
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Status</label>
                    <select
                      value={formData.pool_status}
                      onChange={(e) => handleChange('pool_status', e.target.value)}
                      className="panel-form-select"
                    >
                      <option value="in_pool">In Pool</option>
                      <option value="out_pool">Out Pool</option>
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
                  />
                </div>

                <div className="panel-form-group mt-4">
                  <label className="panel-form-label">Lokasi Unit saat ini</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Contoh: Pool Sunter, Jakarta Utara — Jl. Danau Sunter No. 12"
                    className="panel-form-textarea h-20"
                  />
                </div>
              </div>

              {/* SECTION: SPESIFIKASI KENDARAAN */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-3">2. Spesifikasi Unit</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="panel-form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="panel-form-label mb-0">Warna</label>
                      <button type="button" onClick={() => handleAddColor()} className="text-xs text-primary font-bold hover:underline">+ Tambahkan</button>
                    </div>
                    <select 
                      value={formData.color} 
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') handleAddColor();
                        else handleChange('color', e.target.value);
                      }} 
                      className="panel-form-select"
                    >
                      <option value="">Pilih Warna...</option>
                      {customColors.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__ADD_NEW__">+ Tambahkan Warna Baru...</option>
                    </select>
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Transmisi</label>
                    <select value={formData.transmission} onChange={(e) => handleChange('transmission', e.target.value.toUpperCase())} className="panel-form-select">
                      <option value="OTOMATIS">OTOMATIS</option>
                      <option value="MANUAL">MANUAL</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Bahan Bakar</label>
                    <select value={formData.fuel_type} onChange={(e) => handleChange('fuel_type', e.target.value.toUpperCase())} className="panel-form-select">
                      <option value="BENSIN">BENSIN</option>
                      <option value="SOLAR">SOLAR</option>
                      <option value="HYBRID">HYBRID</option>
                      <option value="EV">EV (LISTRIK)</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Kapasitas Mesin (CC)</label>
                    <input type="text" value={formData.cylinder} onChange={(e) => handleChange('cylinder', e.target.value)} placeholder="Contoh: 1500" className="panel-form-input" />
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Odometer (KM)</label>
                    <input type="text" value={formData.odometer} onChange={(e) => handleChange('odometer', e.target.value)} placeholder="Contoh: 45000" className="panel-form-input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="panel-form-group">
                    <label className="panel-form-label">Nomor Polisi</label>
                    <input type="text" value={formData.police_number} onChange={(e) => handleChange('police_number', e.target.value.toUpperCase())} placeholder="Contoh: B 1234 ABC" className="panel-form-input" />
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-form-label">Nomor BPKB</label>
                    <input type="text" value={formData.bpkb_number} onChange={(e) => handleChange('bpkb_number', e.target.value.toUpperCase())} placeholder="Contoh: K-12345678" className="panel-form-input" />
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

              {/* SECTION: FOTO Barang */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg text-primary mb-3">5. Foto Barang</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PHOTO_FIELDS.map((item) => (
                    <div key={item.key} className="panel-form-group">
                      <label className="panel-form-label">{item.label}</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(item.key, e.target.files?.[0] || null)}
                        disabled={uploadingPhoto === item.key}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      {uploadingPhoto === item.key && (
                        <span className="text-xs text-slate-500 mt-1 block">Mengunggah...</span>
                      )}
                      {formData[item.key] && uploadingPhoto !== item.key && (
                        <span className="text-xs text-success font-bold mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Foto tersimpan
                        </span>
                      )}
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
                      {editId ? "Menyimpan Perubahan..." : "Mengirim Pengajuan..."}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">{editId ? "save" : "publish"}</span>
                      {editId ? "Simpan Perubahan" : "Ajukan Titip Jual"}
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

export default function ProviderAjukanBarang() {
  return (
    <Suspense fallback={null}>
      <ProviderAjukanBarangContent />
    </Suspense>
  );
}
