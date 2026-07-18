import { Axios } from './index';
import { ICreateRecord, IRecord, IRecordWithCategory } from '../types';

// The server's `date` column is a MySQL DATE (no time component); sending a
// full ISO datetime string (e.g. from `new Date().toISOString()`) fails
// under strict SQL mode with "Incorrect date value" — truncate to the
// date-only portion before it ever reaches the API.
function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export async function createRecord(newRecord: ICreateRecord): Promise<IRecord> {
  const res = await Axios.post('/records', {
    price: newRecord.price,
    remarks: newRecord.remarks,
    date: toDateOnly(newRecord.date),
    wallet: newRecord.wallet,
    category: newRecord.category,
  });

  return res.data;
}

export async function fetchRecords(
  walletId: number,
): Promise<IRecordWithCategory[]> {
  const response = await Axios.get(`/records/wallet/${walletId}`);

  return response.data;
}

export async function updateRecord(record: IRecord): Promise<IRecord> {
  const res = await Axios.patch(`/records/${record.id}`, {
    price: record.price,
    remarks: record.remarks,
    date: toDateOnly(record.date),
  });

  return res.data;
}

export async function deleteRecord(id: number) {
  const url = `/records/${id}`;
  const response = await Axios.delete(url);

  return response.data;
}

export async function getRemarks(categoryId: number): Promise<string[]> {
  const url = `/records/category/${categoryId}/remarks`;
  const response = await Axios.get(url);

  return response.data;
}
