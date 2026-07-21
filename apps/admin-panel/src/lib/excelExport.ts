import * as XLSX from 'xlsx';

/**
 * Utility function to export JSON data to Excel (.xlsx) file
 */
export function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Data'
) {
  if (!data || data.length === 0) {
    return false;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column width based on content length
  const keys = Object.keys(data[0] || {});
  const colWidths = keys.map((key) => {
    let maxLen = key.length;
    data.forEach((row) => {
      const val = row[key];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const dateStr = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFilename);
  return true;
}
