import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalysisInput } from "@/components/analysis/AnalysisInput";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: analyses }, { data: usage }] = await Promise.all([
    supabase.from("profiles").select("plan, full_name").eq("id", user.id).single(),
    supabase
      .from("analyses")
      .select("id, input_title, input_type, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("usage_limits")
      .select("analyses_this_month, reset_at")
      .eq("user_id", user.id)
      .single(),
  ]);

  const plan = profile?.plan ?? "free";
  const used = usage?.analyses_this_month ?? 0;
  const FREE_LIMIT = 3;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-52 border-r border-[var(--border)] flex flex-col py-4 px-3 shrink-0">
        <Link href="/" className="text-[var(--text-16)] font-medium text-[var(--text-primary)] px-2 mb-6">
          SHURA
        </Link>
        <nav className="flex flex-col gap-0.5 flex-1">
          <Link
            href="/dashboard"
            className="px-2 h-8 rounded-[var(--radius-md)] text-[var(--text-14)] text-[var(--text-primary)] bg-[var(--bg-active)] flex items-center"
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className="px-2 h-8 rounded-[var(--radius-md)] text-[var(--text-14)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] flex items-center transition-colors"
          >
            Settings
          </Link>
        </nav>
        <div className="px-2 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-12)] text-[var(--text-muted)]">
              {plan === "free" ? `${used}/${FREE_LIMIT} analyses` : "Unlimited"}
            </span>
            <Badge variant={plan === "free" ? "default" : "accent"} className="capitalize">
              {plan}
            </Badge>
          </div>
          {plan === "free" && (
            <div className="h-1 bg-[var(--bg-active)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all"
                style={{ width: `${Math.min((used / FREE_LIMIT) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[var(--text-20)] font-medium text-[var(--text-primary)]">
            New analysis
          </h1>
          <AnalysisInput />
          {plan === "free" && used >= FREE_LIMIT && (
            <div className="flex items-center gap-3 p-3 bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-md)]">
              <span className="text-[var(--text-14)] text-[var(--text-secondary)]">
                You have used all {FREE_LIMIT} free analyses this month.
              </span>
              <Link
                href="/settings"
                className="text-[var(--text-14)] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors shrink-0"
              >
                Upgrade to Pro
              </Link>
            </div>
          )}
        </div>

        {/* Past analyses */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[var(--text-14)] font-medium text-[var(--text-secondary)]">
            Past analyses
          </h2>
          {!analyses?.length ? (
            <div className="py-12 text-center text-[var(--text-14)] text-[var(--text-muted)]">
              No analyses yet. Paste a YouTube URL or Reddit topic above.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {analyses.map((a) => (
                <Link
                  key={a.id}
                  href={a.status === "complete" ? `/analysis/${a.id}` : "#"}
                  className="flex items-center justify-between px-3 h-10 rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="default" className="shrink-0 uppercase">
                      {a.input_type}
                    </Badge>
                    <span className="text-[var(--text-14)] text-[var(--text-primary)] truncate">
                      {a.input_title ?? "Untitled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    {a.status === "failed" && (
                      <Badge variant="danger">Failed</Badge>
                    )}
                    {a.status === "running" && (
                      <Badge variant="warning">Running</Badge>
                    )}
                    <span className="text-[var(--text-12)] text-[var(--text-muted)]">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
