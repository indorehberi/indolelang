const ExcelJS = require('exceljs');
const XLSX = require('xlsx');

async function main() {
  const branchNames = ['Indo-Lelang Jakarta', 'Indo-Lelang Surabaya', 'Indo-Lelang Medan'];

  const CAR_MODELS_BY_BRAND = {
    TOYOTA: ['AVANZA', 'INNOVA', 'FORTUNER', 'ALPHARD', 'RUSH', 'AGYA', 'CALYA', 'YARIS', 'CAMRY', 'VIOS', 'COROLLA']
  };

  const MOTOR_MODELS_BY_BRAND = {
    HONDA: ['BEAT', 'VARIO']
  };

  const ALL_BRANDS = ['TOYOTA', 'HONDA'];

  const COMBINED_MODELS_BY_BRAND = {
    TOYOTA: ['AVANZA', 'INNOVA', 'FORTUNER', 'ALPHARD', 'RUSH', 'AGYA', 'CALYA', 'YARIS', 'CAMRY', 'VIOS', 'COROLLA'],
    HONDA: ['BEAT', 'VARIO']
  };

  const VARIANTS_BY_MODEL = {
    AVANZA: ['1.3 G', '1.5 G']
  };

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template Import Aset');
  const listSheet = workbook.addWorksheet('Data_Lists');

  const columns = [
    { header: 'Kategori (mobil/motor)', key: 'category', width: 22 },
    { header: 'Merek', key: 'brand', width: 18 },
    { header: 'Model', key: 'model', width: 18 },
    { header: 'Tipe / Varian', key: 'type', width: 18 },
    { header: 'Tahun Pembuatan', key: 'year', width: 18 },
    { header: 'No. Polisi', key: 'police_number', width: 15 },
    { header: 'Harga Dasar Limit', key: 'base_price', width: 20 },
    { header: 'Cabang', key: 'branch', width: 22 },
    { header: 'Status Pool (in_pool/out_pool)', key: 'pool_status', width: 25 },
    { header: 'Warna', key: 'color', width: 15 },
    { header: 'Bahan Bakar', key: 'fuel_type', width: 15 },
    { header: 'Transmisi', key: 'transmission', width: 15 },
    { header: 'Bentuk Bodi', key: 'body_type', width: 15 },
    { header: 'Isi Silinder (cc)', key: 'cylinder', width: 18 },
    { header: 'Odometer (km)', key: 'odometer', width: 18 },
    { header: 'No. BPKB', key: 'bpkb_number', width: 15 },
    { header: 'No. Rangka', key: 'frame_number', width: 18 },
    { header: 'No. Mesin', key: 'engine_number', width: 18 },
    { header: 'Catatan / Kondisi', key: 'notes', width: 25 },
    { header: 'Ada STNK?', key: 'doc_stnk', width: 15 },
    { header: 'Masa Berlaku STNK (YYYY-MM-DD)', key: 'stnk_date', width: 28 },
    { header: 'Ada BPKB?', key: 'doc_bpkb', width: 15 },
    { header: 'Ada Faktur?', key: 'doc_faktur', width: 15 },
    { header: 'Ada Kwitansi?', key: 'doc_kwitansi', width: 15 },
    { header: 'Ada Form A?', key: 'doc_form_a', width: 15 },
    { header: 'Ada Copy KTP?', key: 'doc_copy_ktp', width: 15 },
    { header: 'Ada KEUR?', key: 'doc_keur', width: 15 },
    { header: 'Masa Berlaku KEUR (YYYY-MM-DD)', key: 'keur_date', width: 28 },
    { header: 'Ada SPH?', key: 'doc_sph', width: 15 },
  ];

  worksheet.columns = columns;

  // Example Row
  worksheet.addRow({
    category: 'mobil',
    brand: 'TOYOTA',
    model: 'AVANZA',
    type: '1.3 G',
    year: 2022,
    police_number: 'B 1234 ABC',
    base_price: 150000000,
    branch: branchNames[0],
    pool_status: 'in_pool',
    color: 'HITAM',
    fuel_type: 'Bensin',
    transmission: 'Otomatis',
    body_type: 'MPV',
    cylinder: 1300,
    odometer: 45000,
    bpkb_number: 'BPKB-998877',
    frame_number: 'MHK1234567890',
    engine_number: '1NR-123456',
    notes: 'Kondisi mesin bagus, AC dingin',
    doc_stnk: 'Ada',
    stnk_date: '2027-08-15',
    doc_bpkb: 'Ada',
    doc_faktur: 'Ada',
    doc_kwitansi: 'Ada',
    doc_form_a: 'Tidak Ada',
    doc_copy_ktp: 'Ada',
    doc_keur: 'Tidak Ada',
    keur_date: '',
    doc_sph: 'Tidak Ada',
  });

  // User input simulation (Row 3)
  worksheet.addRow({
    category: 'mobil',
    brand: 'MAZDA',
    model: 'MAZDA2',
    type: 'GT',
    year: 2021,
    police_number: 'B 9999 XYZ',
    base_price: 230000000,
    branch: 'Indo-Lelang Jakarta',
    pool_status: 'in_pool',
    color: 'MERAH',
    fuel_type: 'Bensin',
    transmission: 'Otomatis',
    body_type: 'HATCHBACK',
    cylinder: 1500,
    odometer: 25000,
    bpkb_number: 'BPKB-112233',
    frame_number: 'MHK22334455',
    engine_number: 'SKY-223344',
    notes: 'Mulus terawat',
    doc_stnk: 'Ada',
    stnk_date: '2026-12-01',
    doc_bpkb: 'Ada',
    doc_faktur: 'Ada',
    doc_kwitansi: 'Ada',
    doc_form_a: 'Ada',
    doc_copy_ktp: 'Ada',
    doc_keur: 'Tidak Ada',
    keur_date: '',
    doc_sph: 'Tidak Ada',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  
  // Parse with XLSX
  const parsedWb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = parsedWb.SheetNames[0];
  console.log('Sheet Name:', sheetName);
  const parsedWs = parsedWb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(parsedWs, { defval: "" });
  console.log('Parsed rows count:', rows.length);
  console.log('First row keys:', Object.keys(rows[0]));
  console.log('First row data:', rows[0]);
  console.log('Second row data:', rows[1]);
}

main().catch(console.error);
