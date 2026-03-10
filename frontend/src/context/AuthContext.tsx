import React, { createContext, useContext, useState, useEffect } from "react";
import type { Role } from "../types";

interface AuthContextValue {
  token: string | null;
  role: Role | null;
  setAuth: (token: string, role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("accessToken"));
  const [role, setRole] = useState<Role | null>(() => localStorage.getItem("role") as Role | null);

  const setAuth = (t: string, r: Role) => {
    localStorage.setItem("accessToken", t);
    localStorage.setItem("role", r);
    setToken(t);
    setRole(r);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  useEffect(() => {
    if (!token) {
      setRole(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, role, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
