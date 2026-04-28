import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    res.status(401).json({ error: error?.message ?? "Login failed" });
    return;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    profile,
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session) {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }
  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", req.userId!)
    .single();
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(profile);
});

export default router;
