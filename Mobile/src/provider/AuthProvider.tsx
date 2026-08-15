import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/userSlice';

type JwtPayload = {
  username: string;
  sub: number; // user id
  iat: number;
  exp: number; // unix timestamp (seconds)
};

type AuthContextValue = {
  authorized: boolean;
  isSignedIn: boolean;
  userId: number | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------- Hook ----------
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

// ---------- Helper ----------
function decodeToken(token: string | undefined | null): JwtPayload | null {
  if (!token) return null;
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

// ---------- Provider ----------
// Mirrors Client/src/provider/AuthProvider.tsx: derives `authorized`/`userId`
// from the JWT stored in redux (see store/userSlice.ts), rather than reading
// storage directly here — the root layout is responsible for restoring the
// persisted token from expo-secure-store into redux on boot.
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authorized, setAuthorized] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const { access_token, isSignedIn } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const decoded = decodeToken(access_token);

    // Not logged in or invalid token
    if (!decoded || !isSignedIn) {
      setAuthorized(false);
      setUserId(null);
      return;
    }

    const nowInSeconds = Date.now() / 1000;

    if (nowInSeconds > decoded.exp) {
      // Token expired
      dispatch(logout());
      setAuthorized(false);
      setUserId(null);
    } else {
      setAuthorized(true);
      setUserId(decoded.sub);
    }
  }, [access_token, isSignedIn, dispatch]);

  const value: AuthContextValue = {
    authorized,
    isSignedIn,
    userId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
