import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface WalletState {
  id: number;
}

// Mirrors Client/src/store/walletSlice.ts (tracks the user's currently
// selected/favourite wallet id). Persistence to secure storage can be added
// alongside a wallet-detail screen in a follow-up task; for the Home list
// screen this in-memory default is sufficient.
const initialState: WalletState = {
  id: 0,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    updateFavWallet: (state, action: PayloadAction<number>) => {
      state.id = action.payload;
    },
  },
});

export const { updateFavWallet } = walletSlice.actions;

export default walletSlice.reducer;
