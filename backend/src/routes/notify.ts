import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  sendWhatsApp,
  buildLowBalanceMessage,
} from "../services/whatsappService";

const router = Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// POST /api/notify/low-balance  — notify all members below threshold
router.post(
  "/low-balance",
  requireAuth,
  requireAdmin,
  async (_req: AuthRequest, res) => {
    const supabase = getSupabase();
    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        "full_name, phone, whatsapp_api_key, balance, low_balance_threshold",
      );

    const toNotify = (profiles ?? []).filter(
      (p: any) =>
        p.phone && p.whatsapp_api_key && p.balance < p.low_balance_threshold,
    );

    await Promise.allSettled(
      toNotify.map((p: any) =>
        sendWhatsApp(
          p.phone,
          p.whatsapp_api_key,
          buildLowBalanceMessage(p.full_name, p.balance),
        ),
      ),
    );

    res.json({ notified: toNotify.length });
  },
);

export default router;
