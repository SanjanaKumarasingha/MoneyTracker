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

// Google Play / general production hygiene: EXPO_PUBLIC_API_URL is meant to
// point at a LAN IP over plain HTTP only for local dev (see .env.example) —
// refuse to actually send requests over it if that value ever ships in a
// production build. __DEV__ is false in a release JS bundle regardless of
// which EAS build profile produced it, so this can't be bypassed by profile
// name the way an env-var check could be.
Axios.interceptors.request.use((config) => {
  const baseURL = config.baseURL ?? Axios.defaults.baseURL ?? '';
  if (!__DEV__ && baseURL.startsWith('http://')) {
    console.warn(`[MoneyTracker] Refusing insecure HTTP API base URL in production build: ${baseURL}`);
    return Promise.reject(new Error('Insecure HTTP API base URL is not allowed in production builds.'));
  }
  return config;
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

// Google Play Data Safety account-deletion requirement — cascades server
// side (see Server/src/users/users.service.ts's deleteAccount). Always
// scoped to the authenticated user (JwtAuthGuard + req.user.id), not an id
// the client passes.
export async function deleteAccount(): Promise<void> {
  await Axios.delete('/users/me');
}
