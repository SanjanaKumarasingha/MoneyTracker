import { Axios } from '.';
import { ICreateRecord, IRecord, IRecordWithCategory } from '../types';

export async function createRecord(newRecord: ICreateRecord): Promise<IRecord> {
  const res = await Axios.post('v1/records', {
    price: newRecord.price,
    remarks: newRecord.remarks,
    date: newRecord.date,
    wallet: newRecord.wallet,
    category: newRecord.category,
  });

  return res.data;
}

export async function fetchRecords(
  walletId: number,
): Promise<IRecordWithCategory[]> {
  const response = await Axios.get(`/v1/records/wallet/${walletId}`);

  return response.data;
}

export async function updateRecord(record: IRecord): Promise<IRecord> {
  const res = await Axios.patch(`v1/records/${record.id}`, {
    price: record.price,
    remarks: record.remarks,
    date: record.date,
  });

  return res.data;
}

export async function deleteRecord(id: number) {
  const url = `v1/records/${id}`;

  const response = await Axios.delete(url);

  return response.data;
}

export async function getRemarks(categoryId: number): Promise<string[]> {
  const url = `v1/records/category/${categoryId}/remarks`;
  const response = await Axios.get(url);

  return response.data;
}
