const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('kelengkapan_aplikasi.xlsx');

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  
  // Format cells explicitly to inspect grid structure
  const range = XLSX.utils.decode_range(sheet['!ref']);
  let output = '';
  
  for (let r = range.s.r; r <= range.e.r; r++) {
    let rowCells = [];
    let hasData = false;
    
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = { c: c, r: r };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      const cell = sheet[cellRef];
      
      if (cell && cell.v !== undefined && cell.v !== null) {
        rowCells.push(`[Col ${c + 1}]: ${String(cell.v).trim()}`);
        hasData = true;
      } else {
        rowCells.push('');
      }
    }
    
    if (hasData) {
      output += `Row ${r + 1}: ` + rowCells.filter(x => x !== '').join(' | ') + '\n';
    }
  }
  
  fs.writeFileSync(`scripts/${sheetName.replace(/\s+/g, '_')}.txt`, output);
  console.log(`Saved scripts/${sheetName.replace(/\s+/g, '_')}.txt`);
});
