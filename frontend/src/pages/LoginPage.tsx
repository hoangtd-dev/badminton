import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { profile, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && profile) navigate(redirect, { replace: true });
  }, [profile, loading]);

  if (loading) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const err = await signIn(email, password);
    if (err) setError(err.message);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/8 border border-accent/19 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏸</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-primary mb-1">
            Badminton
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && (
            <div className="bg-danger/6 border border-danger/19 rounded-lg px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            loading={submitting}
            size="lg"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
