import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton } from "./UpgradeButton";
import { BillingPortalButton } from "./BillingPortalButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase.from("profiles").select("plan, email, stripe_customer_id").eq("id", user.id).single(),
    supabase.from("usage_limits").select("analyses_this_month, reset_at").eq("user_id", user.id).single(),
  ]);

  const plan = profile?.plan ?? "free";
  const FREE_LIMIT = 3;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center gap-3 px-6 h-14 border-b border-[var(--border)]">
        <Link
          href="/dashboard"
          className="text-[var(--text-14)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          ← Dashboard
        </Link>
        <span className="text-[var(--text-muted)]">/</span>
        <span className="text-[var(--text-14)] text-[var(--text-primary)]">Settings</span>
      </nav>

      <main className="max-w-xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        {/* Account */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[var(--text-16)] font-medium text-[var(--text-primary)]">Account</h2>
          <div className="p-4 bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-lg)] flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-14)] text-[var(--text-secondary)]">Email</span>
              <span className="text-[var(--text-14)] text-[var(--text-primary)]">{profile?.email ?? user.email}</span>
            </div>
          </div>
        </section>

        {/* Billing */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[var(--text-16)] font-medium text-[var(--text-primary)]">Billing</h2>
          <div className="p-4 bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-lg)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-14)] text-[var(--text-secondary)]">Current plan</span>
              <Badge variant={plan === "free" ? "default" : "accent"} className="capitalize">
                {plan}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-14)] text-[var(--text-secondary)]">Analyses this month</span>
              <span className="text-[var(--text-14)] text-[var(--text-primary)]">
                {plan === "free"
                  ? `${usage?.analyses_this_month ?? 0} / ${FREE_LIMIT}`
                  : `${usage?.analyses_this_month ?? 0} (unlimited)`}
              </span>
            </div>
            {usage?.reset_at && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-14)] text-[var(--text-secondary)]">Resets</span>
                <span className="text-[var(--text-14)] text-[var(--text-muted)]">
                  {new Date(usage.reset_at).toLocaleDateString()}
                </span>
              </div>
            )}

            {plan === "free" ? (
              <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border)]">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-14)] font-medium text-[var(--text-primary)]">Pro</span>
                    <span className="text-[var(--text-14)] text-[var(--text-primary)]">$19 / month</span>
                  </div>
                  <span className="text-[var(--text-12)] text-[var(--text-muted)]">
                    Unlimited analyses, PDF export, spec history
                  </span>
                </div>
                <UpgradeButton plan="pro" />
              </div>
            ) : profile?.stripe_customer_id ? (
              <div className="pt-2 border-t border-[var(--border)]">
                <BillingPortalButton />
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
