import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface WalletState {
  id: number;
}

const initialState: WalletState = {
  id: Number(sessionStorage.getItem('FavWallet')) ?? 0,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    updateFavWallet: (state, action: PayloadAction<number>) => {
      state.id = action.payload;
      sessionStorage.setItem('FavWallet', action.payload.toString());
    },
  },
});

export const { updateFavWallet } = walletSlice.actions;

export default walletSlice.reducer;
