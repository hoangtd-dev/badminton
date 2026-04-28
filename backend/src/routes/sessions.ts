import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { deductSessionFee } from "../services/balanceService";

const router = Router();

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Status is derived from date; only finalization sets 'completed' in DB.
function computeStatus(session: { status: string; played_at: string }): string {
  if (session.status === "completed") return "completed";
  const todayStr = new Date().toISOString().slice(0, 10);
  const sessionStr = new Date(session.played_at).toISOString().slice(0, 10);
  return sessionStr <= todayStr ? "ongoing" : "upcoming";
}

router.get("/", requireAuth, async (_req: AuthRequest, res) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("played_at", { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json((data ?? []).map(s => ({ ...s, status: computeStatus(s) })));
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, attendances(*, profile:profiles(*)), group_expenses(*)")
    .eq("id", req.params.id)
    .single();
  if (error || !data) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ ...data, status: computeStatus(data) });
});

router.post("/", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const supabase = getSupabase();
  const { status: _ignored, vote_token: _ignored2, ...rest } = req.body;
  const vote_token = randomUUID();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ ...rest, created_by: req.userId, vote_token })
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ ...data, status: computeStatus(data) });
});

router.put("/:id", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const supabase = getSupabase();
  // Status is auto-derived; strip it along with vote_token from updates
  const { status: _s, vote_token: _v, ...updates } = req.body;
  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ ...data, status: computeStatus(data) });
});

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", req.params.id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  },
);

router.post("/:id/checkin", requireAuth, async (req: AuthRequest, res) => {
  const { playerId, hoursAttended } = req.body;
  if (!playerId) {
    res.status(400).json({ error: "playerId is required" });
    return;
  }
  if (req.userRole !== "admin" && req.userId !== playerId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("attendances")
    .upsert({
      session_id: req.params.id,
      player_id: playerId,
      checked_in_at: new Date().toISOString(),
      voted: false,
      ...(hoursAttended !== undefined ? { hours_attended: hoursAttended } : {}),
    })
    .select()
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// Admin can remove a check-in only if the player did NOT vote via link
router.delete(
  "/:id/checkin/:playerId",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const supabase = getSupabase();
    const { data: att, error: attErr } = await supabase
      .from("attendances")
      .select("id, voted")
      .eq("session_id", req.params.id)
      .eq("player_id", req.params.playerId)
      .single();

    if (attErr || !att) {
      res.status(404).json({ error: "Attendance not found" });
      return;
    }
    if (att.voted) {
      res.status(403).json({ error: "Cannot remove a vote submitted by the player" });
      return;
    }

    const { error } = await supabase
      .from("attendances")
      .delete()
      .eq("id", att.id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  },
);

router.post(
  "/:id/expenses",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const { split_type = "equal", allocations, ...expenseData } = req.body;
    const supabase = getSupabase();

    if (
      split_type === "custom" &&
      Array.isArray(allocations) &&
      allocations.length > 0
    ) {
      const records = allocations.map(
        (alloc: { player_id: string; amount: number }) => ({
          category: expenseData.category,
          note: expenseData.note ?? null,
          session_id: req.params.id,
          created_by: req.userId,
          player_id: alloc.player_id,
          amount: alloc.amount,
        }),
      );
      const { data, error } = await supabase
        .from("group_expenses")
        .insert(records)
        .select();
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.json(data);
      return;
    }

    const { data, error } = await supabase
      .from("group_expenses")
      .insert({
        ...expenseData,
        session_id: req.params.id,
        created_by: req.userId,
        player_id: null,
      })
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  },
);

router.post(
  "/:id/finalize",
  requireAuth,
  requireAdmin,
  async (req: AuthRequest, res) => {
    const { id } = req.params;
    const supabase = getSupabase();

    try {
      const { data: session, error: sessionErr } = await supabase
        .from("sessions")
        .select("*, group_expenses(*), attendances(*, profile:profiles(*))")
        .eq("id", id)
        .single();

      if (sessionErr || !session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      if (session.status === "completed") {
        res.status(400).json({ error: "Session already finalized" });
        return;
      }

      const checkedIn = session.attendances.filter((a: any) => a.checked_in_at);
      if (checkedIn.length === 0) {
        res.status(400).json({ error: "No checked-in players" });
        return;
      }

      const sharedExpenses = session.group_expenses.filter(
        (e: any) => !e.player_id,
      );
      const individualExpenses = session.group_expenses.filter(
        (e: any) => e.player_id,
      );
      const totalShared = sharedExpenses.reduce(
        (sum: number, e: any) => sum + e.amount,
        0,
      );

      const durationHours: number = session.duration_hours || 2;
      const totalWeightedUnits = checkedIn.reduce((sum: number, att: any) => {
        const h = att.hours_attended ?? durationHours;
        return sum + h / durationHours;
      }, 0);
      const sharedCostPerUnit = totalWeightedUnits > 0 ? totalShared / totalWeightedUnits : 0;

      const results = await Promise.allSettled(
        checkedIn.map((att: any) => {
          const playerUnits = (att.hours_attended ?? durationHours) / durationHours;
          const sharedFee = playerUnits * sharedCostPerUnit;
          const individualFee = individualExpenses
            .filter((e: any) => e.player_id === att.player_id)
            .reduce((sum: number, e: any) => sum + e.amount, 0);
          const totalFee = sharedFee + individualFee;
          return deductSessionFee(
            supabase,
            att.player_id,
            totalFee,
            id,
            session.title,
            req.userId!,
          );
        }),
      );

      await supabase
        .from("sessions")
        .update({ status: "completed", cost_per_player: sharedCostPerUnit })
        .eq("id", id);

      const failed = results.filter((r) => r.status === "rejected").length;
      res.json({
        success: true,
        sharedCostPerUnit,
        processed: checkedIn.length - failed,
        failed,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
