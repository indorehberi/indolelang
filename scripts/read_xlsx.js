const XLSX = require('xlsx');

const workbook = XLSX.readFile('kelengkapan_aplikasi.xlsx');

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n\n================================================================================`);
  console.log(`SHEET: ${sheetName}`);
  console.log(`================================================================================`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  data.forEach((row, i) => {
    const hasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    if (!hasData) return;
    
    const formattedRow = row.map((cell, colIndex) => {
      if (cell === null || cell === undefined) return '';
      return `[Col ${colIndex + 1}] ${String(cell).trim()}`;
    }).filter(cell => cell !== '').join('  |  ');
    
    console.log(`Row ${String(i + 1).padStart(2, '0')}: ${formattedRow}`);
  });
});
