import Link from "next/link";
import { AnalysisInput } from "@/components/analysis/AnalysisInput";
import { Badge } from "@/components/ui/badge";

const EXAMPLE_IDEAS = [
  {
    title: "Niche Newsletter Monetizer",
    pitch: "Turn any newsletter audience into a paid community in 10 minutes",
    score: 78,
    source: "YouTube",
  },
  {
    title: "Local Service Booking OS",
    pitch: "The scheduling + CRM layer independent service businesses actually need",
    score: 71,
    source: "Reddit",
  },
  {
    title: "AI Resume Gap Filler",
    pitch: "Identifies skill gaps vs. job postings and suggests the fastest way to close them",
    score: 84,
    source: "YouTube",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-14 border-b border-[var(--border)]">
        <span className="text-[var(--text-16)] font-medium text-[var(--text-primary)] tracking-tight">
          SHURA
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[var(--text-14)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-[var(--text-14)] bg-[var(--accent)] text-white px-3 h-8 rounded-[var(--radius-md)] inline-flex items-center hover:bg-[var(--accent-hover)] transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-xl">
          <h1 className="text-[var(--text-32)] font-medium text-[var(--text-primary)] leading-tight">
            Reveal what to build.
          </h1>
          <p className="text-[var(--text-16)] text-[var(--text-secondary)] leading-relaxed max-w-md">
            Paste a YouTube URL or Reddit topic. Get trend analysis, 3 ranked
            product ideas, and a full spec — in under 60 seconds.
          </p>
        </div>

        <div className="w-full max-w-xl">
          <AnalysisInput />
        </div>

        <p className="text-[var(--text-12)] text-[var(--text-muted)]">
          Free — 3 analyses per month. No card required.
        </p>
      </main>

      {/* Example output */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-[var(--text-12)] text-[var(--text-muted)] mb-4 text-center uppercase tracking-wider font-medium">
            Example output
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXAMPLE_IDEAS.map((idea) => (
              <div
                key={idea.title}
                className="p-4 bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-lg)] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="default">{idea.source}</Badge>
                  <Badge
                    variant={
                      idea.score >= 80
                        ? "success"
                        : idea.score >= 65
                        ? "warning"
                        : "default"
                    }
                  >
                    {idea.score}
                  </Badge>
                </div>
                <h3 className="text-[var(--text-14)] font-medium text-[var(--text-primary)]">
                  {idea.title}
                </h3>
                <p className="text-[var(--text-12)] text-[var(--text-secondary)]">
                  {idea.pitch}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 h-12 flex items-center justify-between">
        <span className="text-[var(--text-12)] text-[var(--text-muted)]">
          SHURA — Hishura (reveal)
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/privacy"
            className="text-[var(--text-12)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[var(--text-12)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
