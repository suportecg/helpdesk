"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserSession } from "@/types/rbac.types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  setUser: (user: UserSession | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: UserSession | null;
}) {
  const [user, setUser] = useState<UserSession | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erro ao recarregar sessão:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  const hasPermission = (code: string) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return user.permissions?.includes(code) || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refresh, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
