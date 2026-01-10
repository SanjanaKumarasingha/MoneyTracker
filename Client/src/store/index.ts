import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import walletReducer from './walletSlice';

export const store = configureStore({
  reducer: { user: userReducer, wallet: walletReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
