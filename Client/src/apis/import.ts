import { Axios } from '.';

export interface IBulkCreateRow {
  price: number;
  date: string;
  remarks?: string;
  categoryId: number;
}

export const bulkCreateRecords = async (payload: {
  walletId: number;
  rows: IBulkCreateRow[];
}): Promise<unknown> => {
  const response = await Axios.post('/v1/records/bulk', payload);
  return response.data;
};
