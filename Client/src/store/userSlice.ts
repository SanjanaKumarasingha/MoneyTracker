import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { IUserInfo } from '../types';
import { Axios } from '../apis';

export interface UserState {
  userInfo: IUserInfo | undefined;
  isSignedIn: boolean;
  access_token: string | undefined;
}

const initialState: UserState = {
  isSignedIn: Boolean(sessionStorage.getItem('isSignedIn')) || false,
  userInfo: undefined,
  access_token: sessionStorage.getItem('access_token') || undefined,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setIsSignedIn: (
      state,
      action: PayloadAction<{
        access_token: string | undefined;
        user: IUserInfo;
      }>,
    ) => {
      state.isSignedIn = true;
      state.userInfo = { ...action.payload.user };
      state.access_token = action.payload.access_token;
      sessionStorage.setItem('isSignedIn', 'true');
      sessionStorage.setItem('access_token', action.payload.access_token || '');
      Axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${action.payload.access_token}`;
    },
    logout: (state) => {
      state.isSignedIn = false;
      state.userInfo = undefined;
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('isSignedIn');
      delete Axios.defaults.headers.common['Authorization'];
    },
  },
});

export const { setIsSignedIn, logout } = userSlice.actions;

export default userSlice.reducer;
