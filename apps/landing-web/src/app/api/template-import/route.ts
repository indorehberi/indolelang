import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { API_BASE_URL, API_PREFIX } from '@/lib/api';

function getColumnLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    let temp = (col - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    col = Math.floor((col - temp) / 26);
  }
  return letter;
}

const CAR_BRANDS = ['TOYOTA', 'HONDA', 'DAIHATSU', 'SUZUKI', 'MITSUBISHI', 'NISSAN', 'MAZDA', 'HYUNDAI', 'KIA', 'WULING', 'BMW', 'MERCEDES-BENZ', 'FORD', 'BYD', 'CHERY', 'MG', 'NETA', 'AION', 'VINFAST', 'GEELY', 'XPENG', 'DENZA'];
const MOTOR_BRANDS = ['HONDA', 'YAMAHA', 'SUZUKI', 'KAWASAKI', 'VESPA', 'TVS', 'KTM'];

const ALL_BRANDS = Array.from(new Set([...CAR_BRANDS, ...MOTOR_BRANDS]));

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

const COMBINED_MODELS_BY_BRAND: Record<string, string[]> = {};
ALL_BRANDS.forEach(brand => {
  const car = CAR_MODELS_BY_BRAND[brand] || [];
  const motor = MOTOR_MODELS_BY_BRAND[brand] || [];
  COMBINED_MODELS_BY_BRAND[brand] = Array.from(new Set([...car, ...motor]));
});

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

export async function GET() {
  // 1. Fetch branches from backend dynamically!
  let branches: any[] = [];
  try {
    const res = await fetch(`${API_BASE_URL}${API_PREFIX}/branches`, {
      cache: 'no-store' // Do not cache so it always fetches latest branches
    });
    const resData = await res.json();
    if (res.ok && resData.success) {
      branches = resData.data || [];
    }
  } catch (err) {
    console.error('Gagal mengambil cabang untuk template excel:', err);
  }

  // Fallback if API fails
  const branchNames = branches.length > 0
    ? branches.map(b => b.name)
    : ['Indo-Lelang Jakarta', 'Indo-Lelang Surabaya', 'Indo-Lelang Medan'];

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template Import Aset');
  const listSheet = workbook.addWorksheet('Data_Lists');
  listSheet.state = 'hidden';

  // Columns definition
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

  // Format Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // dark blue
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' },
    };
  });

  // Example Row
  const exampleRow = worksheet.addRow({
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

  exampleRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  });

  // Populate lists & named ranges
  let colIndex = 1;
  for (const [brand, models] of Object.entries(COMBINED_MODELS_BY_BRAND)) {
    const colLetter = getColumnLetter(colIndex);
    listSheet.getCell(`${colLetter}1`).value = brand.toUpperCase();
    const fullModels = ['N/A', ...models.map(m => m.toUpperCase()), 'LAINNYA'];
    fullModels.forEach((model, i) => {
      listSheet.getCell(`${colLetter}${i + 2}`).value = model;
    });
    // Add underscore prefix for Excel Named Range compatibility (must not start with numbers)
    const normalizedBrand = '_' + brand.replace(/[-\s]/g, '_').toUpperCase();
    const rangeAddress = `Data_Lists!$${colLetter}$2:$${colLetter}$${fullModels.length + 1}`;
    workbook.definedNames.add(rangeAddress, normalizedBrand);
    colIndex++;
  }

  for (const [model, variants] of Object.entries(VARIANTS_BY_MODEL)) {
    const colLetter = getColumnLetter(colIndex);
    listSheet.getCell(`${colLetter}1`).value = model.toUpperCase();
    const fullVariants = ['N/A', ...variants.map(v => v.toUpperCase()), 'LAINNYA'];
    fullVariants.forEach((variant, i) => {
      listSheet.getCell(`${colLetter}${i + 2}`).value = variant;
    });
    // Add underscore prefix for Excel Named Range compatibility (must not start with numbers)
    const normalizedModel = '_' + model.replace(/[-\s]/g, '_').toUpperCase();
    const rangeAddress = `Data_Lists!$${colLetter}$2:$${colLetter}$${fullVariants.length + 1}`;
    workbook.definedNames.add(rangeAddress, normalizedModel);
    colIndex++;
  }

  // Branch list
  const branchColLetter = getColumnLetter(colIndex);
  listSheet.getCell(`${branchColLetter}1`).value = 'BRANCHES';
  branchNames.forEach((name, i) => {
    listSheet.getCell(`${branchColLetter}${i + 2}`).value = name.toUpperCase();
  });
  const branchRangeAddress = `Data_Lists!$${branchColLetter}$2:$${branchColLetter}$${branchNames.length + 1}`;
  workbook.definedNames.add(branchRangeAddress, 'BRANCH_LIST');

  // Helper to define column range from row 2 to 100
  const rangeOf = (col: string) => `${col}2:${col}100`;

  // Category validation
  const ws = worksheet as any;
  ws.dataValidations.add(rangeOf('A'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"N/A,MOBIL,MOTOR,LAINNYA"'],
    showErrorMessage: true,
    errorTitle: 'Input Tidak Valid',
    error: 'Silakan pilih kategori dari list: MOBIL, MOTOR, N/A, atau LAINNYA',
  });

  // Brand validation
  const brandListString = ['N/A', ...ALL_BRANDS.map(b => b.toUpperCase()), 'LAINNYA'].join(',');
  ws.dataValidations.add(rangeOf('B'), {
    type: 'list',
    allowBlank: true,
    formulae: [`"${brandListString}"`],
    showErrorMessage: false,
  });

  // Dependent Model validation
  for (let i = 2; i <= 100; i++) {
    worksheet.getCell(`C${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`=INDIRECT("_"&SUBSTITUTE(SUBSTITUTE(B${i},"-","_")," ","_"))`],
      showErrorMessage: false,
    };
  }

  // Dependent Type validation
  for (let i = 2; i <= 100; i++) {
    worksheet.getCell(`D${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`=INDIRECT("_"&SUBSTITUTE(SUBSTITUTE(C${i},"-","_")," ","_"))`],
      showErrorMessage: false,
    };
  }

  // Branch validation (Dynamic list!)
  ws.dataValidations.add(rangeOf('H'), {
    type: 'list',
    allowBlank: true,
    formulae: ['=BRANCH_LIST'],
    showErrorMessage: true,
    errorTitle: 'Input Tidak Valid',
    error: 'Silakan pilih cabang balai lelang yang terdaftar',
  });

  // Pool Status validation
  ws.dataValidations.add(rangeOf('I'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"N/A,IN_POOL,OUT_POOL,LAINNYA"'],
    showErrorMessage: true,
    errorTitle: 'Input Tidak Valid',
    error: 'Silakan pilih status pool dari list',
  });

  // Color validation
  ws.dataValidations.add(rangeOf('J'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"N/A,HITAM,PUTIH,PERAK (SILVER),ABU-ABU,MERAH,BIRU,HIJAU,KUNING,COKELAT,ORANGE,LAINNYA"'],
    showErrorMessage: false,
  });

  // Fuel validation
  ws.dataValidations.add(rangeOf('K'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"N/A,BENSIN,SOLAR,HYBRID,EV (LISTRIK),LAINNYA"'],
    showErrorMessage: true,
    errorTitle: 'Input Tidak Valid',
    error: 'Silakan pilih tipe bahan bakar dari list',
  });

  // Transmission validation
  ws.dataValidations.add(rangeOf('L'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"N/A,OTOMATIS,MANUAL,LAINNYA"'],
    showErrorMessage: true,
    errorTitle: 'Input Tidak Valid',
    error: 'Silakan pilih transmisi dari list',
  });

  // Body Type validation
  ws.dataValidations.add(rangeOf('M'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"N/A,SEDAN,SUV,MPV,HATCHBACK,PICK UP,TRUK,BUS,LAINNYA"'],
    showErrorMessage: false,
  });

  // Boolean documents validation
  const boolCols = ['T', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AC'];
  for (const col of boolCols) {
    ws.dataValidations.add(rangeOf(col), {
      type: 'list',
      allowBlank: true,
      formulae: ['"N/A,ADA,TIDAK ADA,LAINNYA"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Silakan pilih Ada, Tidak Ada, N/A, atau Lainnya',
    });
  }

  // Date columns formatting and validation (STNK date = U, KEUR date = AB)
  const dateCols = ['U', 'AB'];
  for (const col of dateCols) {
    worksheet.getColumn(col).numFmt = 'yyyy-mm-dd';
    for (let i = 2; i <= 100; i++) {
      worksheet.getCell(`${col}${i}`).dataValidation = {
        type: 'date',
        operator: 'greaterThan',
        allowBlank: true,
        formulae: ['1900-01-01'],
        showInputMessage: true,
        promptTitle: 'Format Tanggal',
        prompt: 'Gunakan format YYYY-MM-DD (Tahun-Bulan-Tanggal), contoh: 2027-08-15',
        showErrorMessage: true,
        errorTitle: 'Tanggal Tidak Valid',
        error: 'Harap masukkan tanggal yang valid dengan format YYYY-MM-DD.',
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template_import_aset.xlsx"',
    },
  });
}
