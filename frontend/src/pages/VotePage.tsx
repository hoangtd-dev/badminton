import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDateTime, getInitials } from "@/lib/utils";
import { getToken } from "@/lib/api";
import type { Session, Profile } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface VoteAttendance {
  player_id: string;
  checked_in_at: string | null;
  hours_attended: number | null;
}

interface VoteData {
  session: Omit<Session, "attendances"> & { attendances: VoteAttendance[] };
}

function getHoursOptions(duration: number): number[] {
  const opts: number[] = [];
  for (let h = 0.5; h <= duration; h += 0.5) {
    opts.push(Math.round(h * 10) / 10);
  }
  return opts;
}

export default function VotePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<VoteData | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [selectedHours, setSelectedHours] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([loadSession(), loadMe()]).finally(() => setPageLoading(false));
  }, [token]);

  // Default selectedHours to full duration once session loads
  useEffect(() => {
    if (data && selectedHours === null) {
      setSelectedHours(data.session.duration_hours ?? 2);
    }
  }, [data]);

  async function loadSession() {
    try {
      const res = await fetch(`${API_BASE}/api/vote/${token}`);
      const d = await res.json();
      if (!res.ok) {
        setPageError(d.error || "Session not found");
        return;
      }
      setData({ session: d.session });
    } catch {
      setPageError("Failed to load session");
    }
  }

  async function loadMe() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMe(await res.json());
    } catch {
      /* not logged in */
    }
  }

  async function handleVote() {
    if (!me) return;
    setVoting(true);
    setVoteError("");

    try {
      const res = await fetch(`${API_BASE}/api/vote/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: me.id, hoursAttended: selectedHours }),
      });
      const d = await res.json();
      if (!res.ok) {
        setVoteError(d.error || "Failed to vote");
        return;
      }
      await loadSession();
    } catch {
      setVoteError("Failed to submit vote");
    } finally {
      setVoting(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔗</p>
          <p className="text-primary font-semibold">Link not found</p>
          <p className="text-sm text-muted mt-1">{pageError}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { session } = data;
  const duration = session.duration_hours ?? 2;
  const hoursOptions = getHoursOptions(duration);
  const attendances = session.attendances ?? [];
  const votedIds = new Set(
    attendances.filter((a) => a.checked_in_at).map((a) => a.player_id),
  );
  const myAttendance = me
    ? attendances.find((a) => a.player_id === me.id && a.checked_in_at)
    : null;
  const isCompleted = session.status === "completed";
  const alreadyVoted = !!myAttendance;

  return (
    <div className="min-h-screen bg-surface p-4 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/8 border border-accent/19 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🏸</span>
          </div>
          <h1 className="text-xl font-bold text-primary">{session.title}</h1>
          <p className="text-sm text-muted mt-0.5">
            {formatDateTime(session.played_at)}
          </p>
          {session.location && (
            <p className="text-xs text-muted">📍 {session.location}</p>
          )}
          <p className="text-xs text-info mt-1">⏱ {duration}h session</p>
        </div>

        {/* Attendee count */}
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-accent">{votedIds.size}</p>
          <p className="text-sm text-muted">
            member{votedIds.size !== 1 ? "s" : ""} attending
          </p>
        </div>

        {/* Action area */}
        {isCompleted ? (
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-primary font-semibold">Session Finalized</p>
            <p className="text-xs text-muted mt-1">Fees have been deducted</p>
          </div>
        ) : !me ? (
          <div className="bg-card border border-border rounded-xl p-5 text-center space-y-3">
            <p className="text-sm text-muted">
              Sign in to confirm your attendance
            </p>
            <button
              onClick={() => navigate(`/login?redirect=/vote/${token}`)}
              className="w-full py-3 rounded-xl bg-accent text-surface font-semibold text-sm hover:bg-accent-hover transition-colors"
            >
              Sign In to Vote
            </button>
          </div>
        ) : alreadyVoted ? (
          <div className="bg-accent/8 border border-accent/25 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/13 flex items-center justify-center text-sm font-bold text-accent">
                {getInitials(me.full_name)}
              </div>
              <div>
                <p className="text-primary font-semibold">{me.full_name}</p>
                <p className="text-xs text-accent">
                  ✓ Attending · {myAttendance.hours_attended ?? duration}h
                  {(myAttendance.hours_attended ?? duration) < duration && (
                    <span className="text-muted"> (half fee)</span>
                  )}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted mt-3">
              Fee will be deducted when the session is finalized
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-card-hover border border-border flex items-center justify-center text-sm font-bold text-muted">
                {getInitials(me.full_name)}
              </div>
              <div>
                <p className="text-primary font-medium">{me.full_name}</p>
                <p className="text-xs text-muted">How long will you attend?</p>
              </div>
            </div>

            {/* Hours selector */}
            <div>
              <p className="text-xs text-muted mb-2">Hours attending</p>
              <div className="flex gap-2">
                {hoursOptions.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHours(h)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      selectedHours === h
                        ? "bg-accent text-surface"
                        : "bg-surface-alt border border-border text-muted hover:text-primary"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              {selectedHours !== null && selectedHours < duration && (
                <p className="text-xs text-warning mt-2">
                  ⚡ You'll be charged{" "}
                  {Math.round((selectedHours / duration) * 100)}% of the full
                  fee
                </p>
              )}
            </div>

            {voteError && <p className="text-xs text-danger">{voteError}</p>}
            <button
              onClick={handleVote}
              disabled={voting || selectedHours === null}
              className="w-full py-3 rounded-xl bg-accent text-surface font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {voting
                ? "Confirming..."
                : `I'm Attending${selectedHours ? ` (${selectedHours}h)` : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
