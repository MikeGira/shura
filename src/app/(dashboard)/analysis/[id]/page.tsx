import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/analysis/ProductCard";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!analysis) notFound();

  const [{ data: ideas }, { data: spec }] = await Promise.all([
    supabase
      .from("product_ideas")
      .select("*")
      .eq("analysis_id", id)
      .order("rank"),
    supabase
      .from("specs")
      .select("prd_markdown")
      .eq("analysis_id", id)
      .single(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-14 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-[var(--text-14)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
        <button
          onClick={() => window.print()}
          className="text-[var(--text-14)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Export PDF
        </button>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        {/* Source */}
        <div className="flex items-center gap-3">
          <Badge variant="default" className="uppercase">
            {analysis.input_type}
          </Badge>
          <h1 className="text-[var(--text-20)] font-medium text-[var(--text-primary)] truncate">
            {analysis.input_title ?? analysis.input_value}
          </h1>
        </div>

        {/* Product ideas */}
        {ideas && ideas.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[var(--text-14)] font-medium text-[var(--text-secondary)]">
              Product opportunities
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {ideas.map((idea) => (
                <ProductCard
                  key={idea.id}
                  idea={idea}
                  isTop={idea.rank === 1}
                  onViewSpec={idea.rank === 1 ? () => {
                    document.getElementById("spec")?.scrollIntoView({ behavior: "smooth" });
                  } : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Spec */}
        {spec?.prd_markdown && (
          <div id="spec" className="flex flex-col gap-4">
            <h2 className="text-[var(--text-14)] font-medium text-[var(--text-secondary)]">
              Product spec — #{ideas?.[0]?.title}
            </h2>
            <div className="prose-shura p-6 bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-lg)]">
              <SpecContent markdown={spec.prd_markdown} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SpecContent({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-[var(--text-16)] font-medium text-[var(--text-primary)] mt-4 mb-1 first:mt-0">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-[var(--text-20)] font-medium text-[var(--text-primary)] mb-2">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 text-[var(--text-14)] text-[var(--text-secondary)]">
              <span className="text-[var(--text-muted)] shrink-0">·</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line.startsWith("| ")) {
          return (
            <div key={i} className="text-[var(--text-12)] font-mono text-[var(--text-secondary)]">
              {line}
            </div>
          );
        }
        if (line.trim() === "" || line.trim() === "---") {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="text-[var(--text-14)] text-[var(--text-secondary)] leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}
