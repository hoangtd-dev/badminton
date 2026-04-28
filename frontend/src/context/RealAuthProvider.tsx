import { useEffect, useState } from "react";
import { api, setTokens, clearTokens, getToken } from "@/lib/api";
import { AuthContext } from "./AuthContext";
import type { Profile } from "@/types";

export function RealAuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get<Profile>("/api/auth/me")
      .then(setProfile)
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const data = await api.post<{
        token: string;
        refreshToken: string;
        profile: Profile;
      }>("/api/auth/login", { email, password });
      setTokens(data.token, data.refreshToken);
      setProfile(data.profile);
      return null;
    } catch (e: any) {
      return { message: JSON.parse(e.message)?.error };
    }
  }

  async function signOut() {
    clearTokens();
    setProfile(null);
  }

  async function refreshProfile() {
    const updated = await api.get<Profile>("/api/auth/me");
    setProfile(updated);
  }

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        isAdmin: profile?.role === "admin",
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
