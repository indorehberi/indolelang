const ExcelJS = require('exceljs');
const path = require('path');

function getColumnLetter(col) {
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

const CAR_MODELS_BY_BRAND = {
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

const MOTOR_MODELS_BY_BRAND = {
  HONDA: ['BEAT', 'VARIO', 'SCOOPY', 'PCX', 'ADV', 'CBR', 'SUPRA', 'REVO', 'CB150R', 'CRF150L'],
  YAMAHA: ['NMAX', 'AEROX', 'LEXI', 'MIO', 'FINO', 'VIXION', 'R15', 'R25', 'MT-15', 'WR155R', 'JUPITER', 'VEGA'],
  SUZUKI: ['SATRIA', 'GSX-R150', 'GSX-S150', 'NEX', 'ADDRESS', 'SMASH'],
  KAWASAKI: ['NINJA 250', 'NINJA ZX-25R', 'KLX 150', 'W175', 'D-TRACKER'],
  VESPA: ['PRIMAVERA', 'SPRINT', 'GTS', 'LX', 'S 125'],
  TVS: ['CALLISTO', 'NTORQ', 'APACHE'],
  KTM: ['DUKE 200', 'DUKE 250', 'DUKE 390', 'RC 200', 'RC 250']
};

const VARIANTS_BY_MODEL = {
  AVANZA: ['1.3 G', '1.5 G', '1.3 E', 'VELOZ 1.5'],
  INNOVA: ['2.0 G', '2.0 V', '2.4 G', '2.4 V', 'VENTURER', 'ZENIX Q', 'ZENIX V', 'ZENIX G'],
  FORTUNER: ['2.4 G', '2.4 VRZ', '2.7 SRZ', '2.8 VRZ GR SPORT'],
  ALPHARD: ['2.5 G', '2.5 X', '3.5 Q'],
  RUSH: ['1.5 G', '1.5 S TRD', '1.5 GR SPORT'],
  AGYA: ['1.2 G', '1.2 GR SPORT'],
  CALYA: ['1.2 G', '1.2 E'],
  YARIS: ['1.5 G', '1.5 TRD', '1.5 GR SPORT'],
  BRIO: ['1.2 S', '1.2 E', '1.2 RS'],
  JAZZ: ['1.5 S', '1.5 RS'],
  'HR-V': ['1.5 S', '1.5 E', '1.5 SE', '1.5 TURBO RS'],
  'CR-V': ['2.0 I-VTEC', '1.5 TURBO PRESTIGE', '2.0 RS E:HEV'],
  MOBILIO: ['1.5 S', '1.5 E', '1.5 RS'],
  'BR-V': ['1.5 S', '1.5 E', '1.5 PRESTIGE'],
  XENIA: ['1.3 X', '1.3 R', '1.5 R'],
  TERIOS: ['1.5 X', '1.5 R', '1.5 R CUSTOM'],
  SIGRA: ['1.0 M', '1.2 X', '1.2 R'],
  AYLA: ['1.0 X', '1.2 R'],
  'GRAN MAX': ['1.3 PICK UP', '1.5 PICK UP', '1.3 BLIND VAN'],
  ERTIGA: ['1.4 GL', '1.4 GX', 'HYBRID SS'],
  CARRY: ['1.5 PICK UP', 'FUTURA 1.5'],
  XPANDER: ['GLS', 'EXCEED', 'SPORT', 'ULTIMATE', 'CROSS'],
  'PAJERO SPORT': ['GLX', 'EXCEED', 'DAKAR', 'DAKAR ULTIMATE'],
  L300: ['PICK UP', 'BOX'],
  'GRAND LIVINA': ['1.5 SV', '1.5 XV', '1.5 HIGHWAY STAR'],
  BEAT: ['CBS', 'CBS ISS', 'DELUXE', 'STREET'],
  VARIO: ['125 CBS', '150 EXCLUSIVE', '160 ABS'],
  SCOOPY: ['SPORTY', 'STYLISH', 'PRESTIGE'],
  PCX: ['150 ABS', '160 CBS', '160 ABS'],
  NMAX: ['155 STANDARD', '155 CONNECTED ABS'],
  AEROX: ['155 STANDARD', '155 CONNECTED ABS']
};

// Combine car and motor models under the same brand
const COMBINED_MODELS_BY_BRAND = {};
ALL_BRANDS.forEach(brand => {
  const car = CAR_MODELS_BY_BRAND[brand] || [];
  const motor = MOTOR_MODELS_BY_BRAND[brand] || [];
  COMBINED_MODELS_BY_BRAND[brand] = Array.from(new Set([...car, ...motor]));
});

async function main() {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Main Template
  const worksheet = workbook.addWorksheet('Template Import Aset');
  
  // Sheet 2: Data Lists (Hidden)
  const listSheet = workbook.addWorksheet('Data_Lists');
  listSheet.state = 'hidden';

  // Columns definition for main template
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

  // Example Row (Row 2)
  const exampleRow = worksheet.addRow({
    category: 'mobil',
    brand: 'TOYOTA',
    model: 'AVANZA',
    type: '1.3 G',
    year: 2022,
    police_number: 'B 1234 ABC',
    base_price: 150000000,
    branch: 'Indo-Lelang Jakarta',
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

  // Style example row
  exampleRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } }; // slate-600
  });

  // Populate Data Lists Sheet and define Named Ranges
  let colIndex = 1;
  for (const [brand, models] of Object.entries(COMBINED_MODELS_BY_BRAND)) {
    const colLetter = getColumnLetter(colIndex);
    
    // Write brand header in row 1 of Data_Lists sheet
    listSheet.getCell(`${colLetter}1`).value = brand;
    
    // Write models
    models.forEach((model, i) => {
      listSheet.getCell(`${colLetter}${i + 2}`).value = model;
    });
    
    // Excel named ranges do not support hyphens, replace with underscore
    const normalizedBrand = brand.replace('-', '_');
    
    // Define the range address (e.g. Data_Lists!$A$2:$A$12)
    const rangeAddress = `Data_Lists!$${colLetter}$2:$${colLetter}$${models.length + 1}`;
    
    workbook.definedNames.add(rangeAddress, normalizedBrand);
    colIndex++;
  }

  // Populate variants mapping to Data Lists Sheet
  for (const [model, variants] of Object.entries(VARIANTS_BY_MODEL)) {
    const colLetter = getColumnLetter(colIndex);
    listSheet.getCell(`${colLetter}1`).value = model;
    variants.forEach((variant, i) => {
      listSheet.getCell(`${colLetter}${i + 2}`).value = variant;
    });
    // Named range for model (replacing spaces and hyphens with underscores)
    const normalizedModel = model.replace(/[-\s]/g, '_');
    const rangeAddress = `Data_Lists!$${colLetter}$2:$${colLetter}$${variants.length + 1}`;
    workbook.definedNames.add(rangeAddress, normalizedModel);
    colIndex++;
  }

  // Helper to define column range from row 2 to 100
  const rangeOf = (col) => `${col}2:${col}100`;

  // Category
  worksheet.dataValidations.add(rangeOf('A'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"mobil,motor"'],
    showErrorMessage: true,
    errorTitle: 'Input Tidak Valid',
    error: 'Silakan pilih kategori dari list: mobil atau motor',
  });

  // Brand
  const brandListString = ALL_BRANDS.join(',');
  worksheet.dataValidations.add(rangeOf('B'), {
    type: 'list',
    allowBlank: true,
    formulae: [`"${brandListString}"`],
    showErrorMessage: false, // Let user type custom brands
  });

  // Dependent Model Dropdown validation using INDIRECT!
  for (let i = 2; i <= 100; i++) {
    worksheet.getCell(`C${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`=INDIRECT(SUBSTITUTE(B${i},"-","_"))`],
      showErrorMessage: false, // Let user type custom models
    };
  }

  // Dependent Tipe/Varian Dropdown validation using INDIRECT!
  for (let i = 2; i <= 100; i++) {
    worksheet.getCell(`D${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`=INDIRECT(SUBSTITUTE(SUBSTITUTE(C${i},"-","_")," ","_"))`],
      showErrorMessage: false, // Let user type custom variants
    };
  }

  // Pool Status
  worksheet.dataValidations.add(rangeOf('I'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"in_pool,out_pool"'],
    showErrorMessage: true,
    errorTitle: 'Input Tidak Valid',
    error: 'Silakan pilih status pool: in_pool atau out_pool',
  });

  // Color
  worksheet.dataValidations.add(rangeOf('J'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"N/A,HITAM,PUTIH,PERAK (SILVER),ABU-ABU,MERAH,BIRU,HIJAU,KUNING,COKELAT,ORANGE"'],
    showErrorMessage: false,
  });

  // Fuel Type
  worksheet.dataValidations.add(rangeOf('K'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"Bensin,Solar,Listrik,Hybrid"'],
    showErrorMessage: true,
    errorTitle: 'Input Tidak Valid',
    error: 'Silakan pilih tipe bahan bakar dari list',
  });

  // Transmission
  worksheet.dataValidations.add(rangeOf('L'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"Otomatis,Manual"'],
    showErrorMessage: true,
    errorTitle: 'Input Tidak Valid',
    error: 'Silakan pilih transmisi: Otomatis atau Manual',
  });

  // Body Type
  worksheet.dataValidations.add(rangeOf('M'), {
    type: 'list',
    allowBlank: true,
    formulae: ['"N/A,SEDAN,SUV,MPV,HATCHBACK,PICK UP,TRUK,BUS"'],
    showErrorMessage: false,
  });

  // Boolean documents
  const boolCols = ['T', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AC'];
  for (const col of boolCols) {
    worksheet.dataValidations.add(rangeOf(col), {
      type: 'list',
      allowBlank: true,
      formulae: ['"Ada,Tidak Ada"'],
      showErrorMessage: true,
      errorTitle: 'Input Tidak Valid',
      error: 'Silakan pilih Ada atau Tidak Ada',
    });
  }

  // Save the template file to apps/landing-web/public
  const outputPath = path.join(__dirname, '..', 'public', 'template_import_aset.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log('Template created successfully with cascading dropdowns at:', outputPath);
}

main().catch(console.error);
