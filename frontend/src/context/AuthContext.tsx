import { createContext, useContext } from "react";
import type { Profile } from "@/types";

export interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  console.dir(ctx.profile);
  if (!ctx)
    throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}
