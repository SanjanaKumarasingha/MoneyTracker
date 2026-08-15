import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { jwtDecode } from "jwt-decode";
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
  isInitializing: boolean;
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
function decodeToken(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

// ---------- Provider ----------
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authorized, setAuthorized] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  // Starts true so consumers (e.g. AuthLayout) can tell "haven't checked the
  // token yet" apart from "checked, and the user isn't authorized" - without
  // this, a hard reload of a protected route reads `authorized === false` on
  // the very first render (before this effect runs) and bounces to /login.
  const [isInitializing, setIsInitializing] = useState(true);

  const { access_token, isSignedIn } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const storedToken = access_token ?? sessionStorage.getItem('access_token');
    const decoded = decodeToken(storedToken);

    // Not logged in or invalid token
    if (!decoded || !isSignedIn) {
      dispatch(logout());
      setAuthorized(false);
      setUserId(null);
      setIsInitializing(false);
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
    setIsInitializing(false);
  }, [access_token, isSignedIn, dispatch]);

  const value: AuthContextValue = {
    authorized,
    isSignedIn,
    userId,
    isInitializing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
