import { Axios } from '.';
import { IRecordWithCategory, ITransferRecord } from '../types';

export const transferBetweenWallets = async (
  transfer: ITransferRecord,
): Promise<{ out: IRecordWithCategory; in: IRecordWithCategory }> => {
  const response = await Axios.post('/v1/records/transfer', transfer);
  return response.data;
};
