import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import type { Farm, SessionUser } from "./types";

type AuthState = {
  ready: boolean;
  user: SessionUser | null;
  farms: Farm[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);

  async function loadBootstrap() {
    const data = await api<{ user: SessionUser; farms: Farm[] }>("/api/mobile/bootstrap");
    setUser(data.user);
    setFarms(data.farms);
  }

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          await loadBootstrap();
        } catch {
          await setToken(null);
        }
      }
      setReady(true);
    })();
  }, []);

  async function signIn(email: string, password: string) {
    const data = await api<{ token: string; user: SessionUser }>("/api/auth/mobile-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await setToken(data.token);
    await loadBootstrap();
  }

  async function signOut() {
    await setToken(null);
    setUser(null);
    setFarms([]);
  }

  return (
    <AuthContext.Provider value={{ ready, user, farms, signIn, signOut, refresh: loadBootstrap }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
