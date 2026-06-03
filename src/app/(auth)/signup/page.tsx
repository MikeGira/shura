"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      },
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Link href="/" className="text-[var(--text-16)] font-medium text-[var(--text-primary)] mb-2">
            SHURA
          </Link>
          <h1 className="text-[var(--text-20)] font-medium text-[var(--text-primary)]">
            Create your account
          </h1>
          <p className="text-[var(--text-14)] text-[var(--text-secondary)]">
            Free — 3 analyses per month, no card required.
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-lg)] text-[var(--text-14)] text-[var(--text-secondary)]">
            Check your email. We sent a link to{" "}
            <strong className="text-[var(--text-primary)]">{email}</strong>.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Button variant="secondary" onClick={handleGoogleSignup} className="w-full">
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[var(--text-12)] text-[var(--text-muted)]">or</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <form onSubmit={handleEmailSignup} className="flex flex-col gap-3">
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
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
