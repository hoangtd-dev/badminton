import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSessions, useCreateSession } from "@/hooks/useSessions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import type { SessionStatus } from "@/types";

const STATUS_BADGE: Record<
  SessionStatus,
  { variant: "success" | "warning" | "info" | "default"; label: string }
> = {
  upcoming: { variant: "info", label: "⏰ Upcoming" },
  ongoing: { variant: "warning", label: "🔴 Live" },
  completed: { variant: "default", label: "✅ Completed" },
};

export default function SessionsPage() {
  const { profile, isAdmin } = useAuth();
  const { data: sessions, isLoading } = useSessions();
  const createSession = useCreateSession();
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", played_at: "", location: "", duration_hours: "2" });
  const [error, setError] = useState("");

  function handleDateChange(value: string) {
    const suggested = value
      ? new Date(value).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })
      : '';
    setForm(f => ({
      ...f,
      played_at: value,
      title: f.title === '' || f.title === suggestTitle(f.played_at) ? suggested : f.title,
    }));
  }

  function suggestTitle(datetimeStr: string) {
    if (!datetimeStr) return '';
    return new Date(datetimeStr).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  const filtered = (sessions ?? []).filter((s) =>
    tab === "upcoming" ? s.status !== "completed" : s.status === "completed",
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!profile) return;
    try {
      await createSession.mutateAsync({
        title: form.title,
        played_at: form.played_at,
        location: form.location || null,
        status: "upcoming",
        cost_per_player: 0,
        duration_hours: parseFloat(form.duration_hours) || 2,
      });
      setShowCreate(false);
      setForm({ title: "", played_at: "", location: "", duration_hours: "2" });
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-primary">
            Sessions
          </h2>
          <p className="text-sm text-muted mt-0.5">All badminton sessions</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)}>+ New Session</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-alt border border-border rounded-lg p-1 w-fit">
        {(["upcoming", "completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
              tab === t
                ? "bg-accent text-surface"
                : "text-muted hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-card border border-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">🏸</p>
          <p className="text-muted">No {tab} sessions</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const badge = STATUS_BADGE[session.status];
            return (
              <Link key={session.id} to={`/sessions/${session.id}`}>
                <Card className="hover:border-border-hover hover:bg-card-hover transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-primary">
                          {session.title}
                        </h3>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted mt-1">
                        {formatDateTime(session.played_at)}
                      </p>
                      {session.location && (
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                          📍 {session.location}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {session.status !== "completed" && (
                        <p className="text-xs text-info">
                          {formatRelativeTime(session.played_at)}
                        </p>
                      )}
                      {session.cost_per_player > 0 && (
                        <p className="text-sm font-semibold text-accent mt-1">
                          AUD {session.cost_per_player.toFixed(2)}/player
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Session"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Date & Time"
            type="datetime-local"
            value={form.played_at}
            onChange={(e) => handleDateChange(e.target.value)}
            required
          />
          <Input
            label="Title"
            placeholder="e.g. Tuesday 29 Apr"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Session Duration</label>
            <div className="flex gap-2">
              {[1, 1.5, 2, 2.5, 3].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, duration_hours: String(h) }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    parseFloat(form.duration_hours) === h
                      ? 'bg-accent text-surface'
                      : 'bg-surface-alt border border-border text-muted hover:text-primary'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Location (optional)"
            placeholder="e.g. Melbourne Park Court 3"
            value={form.location}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreate(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createSession.isPending}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
