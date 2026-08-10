import * as XLSX from 'xlsx';
import { IWalletRecordWithCategory } from '../types';

// Fully client-side - the wallet's records are already loaded via
// useRecord(), so this just reshapes them into a worksheet and triggers a
// download. Deliberately a clean Date/Description/Amount/Category/Type
// sheet rather than replicating the original personal spreadsheet's
// SUMIF-pivot-table layout - that pivot was just a formula artifact, not
// something worth exporting back out.
export function exportWalletToExcel(wallet: IWalletRecordWithCategory) {
  const sheetRows = (wallet.records ?? []).map((record) => ({
    Date: record.date,
    Description: record.remarks ?? '',
    Amount: Number(record.price),
    Category: record.category?.name ?? '',
    Type: record.category?.type ?? '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, wallet.name.slice(0, 31) || 'Records');

  const safeName = wallet.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'wallet';
  XLSX.writeFile(workbook, `${safeName}.xlsx`);
}
