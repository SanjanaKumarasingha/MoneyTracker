import { Axios } from './index';
import { IRecordWithCategory, ITransferRecord } from '../types';

// Mirrors Client/src/apis/transfer.ts.
export async function transferBetweenWallets(
  transfer: ITransferRecord,
): Promise<{ out: IRecordWithCategory; in: IRecordWithCategory }> {
  const response = await Axios.post('/records/transfer', transfer);
  return response.data;
}
