"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Authentication failed. Please try again.",
  link_expired: "This login link has expired. Request a new one.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(
    errorParam ? (ERROR_MESSAGES[errorParam] ?? "An error occurred.") : ""
  );

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirect}`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirect}`,
      },
    });
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-[var(--text-16)] font-medium text-[var(--text-primary)] mb-2">
          SHURA
        </Link>
        <h1 className="text-[var(--text-20)] font-medium text-[var(--text-primary)]">
          Welcome back
        </h1>
      </div>

      {sent ? (
        <div className="p-4 bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-14)] text-[var(--text-secondary)]">
          Check your email. We sent a login link to{" "}
          <strong className="text-[var(--text-primary)]">{email}</strong>.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button variant="secondary" onClick={handleGoogleLogin} className="w-full">
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[var(--text-12)] text-[var(--text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              autoComplete="email"
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Continue with email
            </Button>
          </form>
        </div>
      )}

      <p className="text-[var(--text-12)] text-[var(--text-muted)] text-center">
        No account?{" "}
        <Link
          href="/signup"
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Sign up free
        </Link>
      </p>
    </div>
  );
}
