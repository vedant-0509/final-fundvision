import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setTokens, clearTokens, getToken } from '../api/client';

interface User { id: number; email: string; username: string; full_name: string | null; }
interface AuthCtx {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      api.auth.me().then(setUser).catch(() => clearTokens()).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    setTokens(res.access_token, res.refresh_token);
    const me = await api.auth.me();
    setUser(me);
  };

  const register = async (email: string, username: string, password: string, fullName?: string) => {
    const res = await api.auth.register({ email, username, password, full_name: fullName });
    setTokens(res.access_token, res.refresh_token);
    const me = await api.auth.me();
    setUser(me);
  };

  const logout = () => { api.auth.logout().catch(() => {}); clearTokens(); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error('useAuth outside provider'); return c; };
