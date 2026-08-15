import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { IUserInfo } from '../types';
import { Axios } from '../apis';

export interface UserState {
  userInfo: IUserInfo | undefined;
  isSignedIn: boolean;
  access_token: string | undefined;
}

// Unlike the web app's userSlice (which reads sessionStorage synchronously for
// its initial state), expo-secure-store is async, so the initial state here is
// always "signed out" and the root layout restores a persisted session on
// boot by dispatching setIsSignedIn once the token has been read & validated.
const initialState: UserState = {
  isSignedIn: false,
  userInfo: undefined,
  access_token: undefined,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setIsSignedIn: (
      state,
      action: PayloadAction<{
        access_token: string | undefined;
        user: IUserInfo | undefined;
      }>,
    ) => {
      state.isSignedIn = true;
      state.userInfo = action.payload.user ? { ...action.payload.user } : undefined;
      state.access_token = action.payload.access_token;
      Axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${action.payload.access_token}`;
    },
    logout: (state) => {
      state.isSignedIn = false;
      state.userInfo = undefined;
      state.access_token = undefined;
      delete Axios.defaults.headers.common['Authorization'];
    },
  },
});

export const { setIsSignedIn, logout } = userSlice.actions;

export default userSlice.reducer;
