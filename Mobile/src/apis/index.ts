import axios from 'axios';
import {
  IUpdatePasswordDto,
  IUser,
  IUserInfo,
  LoginResponse,
  NewUser,
} from '../types';

// Mirrors Client/src/apis/index.ts, but points at the mobile-appropriate base
// URL and does not need the '/v1' prefix on each call because the base URL
// already includes the API version (see .env.example).
export const Axios = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

export async function signIn(user: IUser): Promise<LoginResponse> {
  const res = await Axios.post('/auth/login', {
    ...user,
  });

  return res.data;
}

export async function register(newUser: NewUser): Promise<IUserInfo> {
  const res = await Axios.post('/users', { ...newUser });

  return res.data;
}

export async function profile(id: number): Promise<IUserInfo> {
  const res = await Axios.get(`/users/${id}`);

  return res.data;
}

export async function updateUser(updateInfo: {
  user: IUserInfo;
  id: number;
}): Promise<IUserInfo> {
  const res = await Axios.patch(`/users/${updateInfo.id}`, {
    ...updateInfo.user,
  });

  return res.data;
}

export async function updatePassword(
  updatePassword: IUpdatePasswordDto,
): Promise<IUserInfo> {
  const res = await Axios.patch(`/users/${updatePassword.id}/update-password`, {
    ...updatePassword,
  });

  return res.data;
}

export async function updateCategoryOrder(order: {
  id: number;
  categoryOrder: number[];
}): Promise<IUserInfo> {
  const res = await Axios.patch(`/users/${order.id}/category-order`, {
    id: order.id,
    categoryOrder: order.categoryOrder,
  });

  return res.data;
}
