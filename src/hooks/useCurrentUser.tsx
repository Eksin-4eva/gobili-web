import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getUserInfo } from "@/api/auth";
import { clearSession, getStoredUser, isLoggedIn, setStoredUser } from "@/lib/session";
import type { User } from "@/types/user";

interface CurrentUserContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  const setUser = useCallback((next: User | null) => {
    setUserState(next);
    setStoredUser(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setUser(null);
      return;
    }
    setLoading(true);
    try {
      const info = await getUserInfo();
      setUser(info);
    } catch {
      // 鉴权失败时由 request 层处理跳转
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, loading, refresh, logout, setUser }),
    [user, loading, refresh, logout, setUser],
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return ctx;
}
