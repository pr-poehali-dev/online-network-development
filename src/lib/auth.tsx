import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, setAuth, clearAuth, getToken, getUserId } from "@/lib/api";

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  avatars: string[];
  is_private: boolean;
  is_admin: boolean;
  is_blocked: boolean;
  block_reason?: string;
  verified: string;
  theme: string;
  links: {
    telegram?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  followers_count: number;
  following_count: number;
  posts_count: number;
  privacy: {
    who_sees_likes: string;
    who_sees_reposts: string;
    who_sees_followers: string;
    who_sees_following: string;
    who_sees_friends: string;
    who_can_message: string;
  };
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isGuest: boolean;
  refreshUser: () => Promise<void>;
  isBlocked: boolean;
  blockReason: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const refreshUser = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiGet("/auth/me");
      if (data.is_blocked) {
        setIsBlocked(true);
        setBlockReason(data.block_reason || "");
        setUser(data);
      } else {
        setIsBlocked(false);
        setBlockReason("");
        setUser(data);
      }
    } catch {
      clearAuth();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await apiPost("/auth/login", { email, password });
    setAuth(data.token, data.user_id);
    setToken(data.token);
    const me = await apiGet("/auth/me");
    if (me.is_blocked) {
      setIsBlocked(true);
      setBlockReason(me.block_reason || "");
    }
    setUser(me);
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await apiPost("/auth/register", { username, email, password });
    setAuth(data.token, data.user_id);
    setToken(data.token);
    const me = await apiGet("/auth/me");
    setUser(me);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
    setIsBlocked(false);
    setBlockReason("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin: user?.is_admin ?? false,
        isGuest: !user,
        refreshUser,
        isBlocked,
        blockReason,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export type { User };
