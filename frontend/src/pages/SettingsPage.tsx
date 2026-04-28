import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateMember } from "@/hooks/useMembers";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const updateMember = useUpdateMember();

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    // whatsapp_api_key: profile?.whatsapp_api_key ?? "",
  });
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    await updateMember.mutateAsync({
      id: profile.id,
      full_name: form.full_name,
      phone: form.phone || null,
      // whatsapp_api_key: form.whatsapp_api_key || null,
    });
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-display font-bold text-primary">
          Settings
        </h2>
        <p className="text-sm text-muted mt-0.5">Manage your profile</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <h3 className="text-sm font-semibold text-primary mb-4">Profile</h3>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={form.full_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, full_name: e.target.value }))
              }
              required
            />
            <Input
              label="Phone (WhatsApp format: 614xxxxxxxx)"
              placeholder="614xxxxxxxx"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>
        </Card>

        {/* <Card>
          <h3 className="text-sm font-semibold text-primary mb-1">
            WhatsApp Notifications
          </h3>
          <p className="text-xs text-muted mb-4">
            Send{" "}
            <strong className="text-primary">
              I allow callmebot to send me messages
            </strong>{" "}
            to <strong className="text-primary">+34 644 56 55 18</strong> on
            WhatsApp, then paste your API key below.
          </p>
          <div className="space-y-4">
            <Input
              label="CallMeBot API Key"
              placeholder="e.g. 123456"
              value={form.whatsapp_api_key}
              onChange={(e) =>
                setForm((f) => ({ ...f, whatsapp_api_key: e.target.value }))
              }
            />
          </div>
        </Card> */}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={updateMember.isPending}>
            {saved ? "✓ Saved" : "Save Changes"}
          </Button>
          <Button type="button" variant="danger" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </form>
    </div>
  );
}
