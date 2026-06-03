import { Badge } from "@/components/ui/badge";

interface Idea {
  rank: number;
  title: string;
  pitch: string;
  target_user: string;
  opportunity_score: number;
  problem_solved: string;
}

interface Props {
  idea: Idea;
  isTop?: boolean;
  onViewSpec?: () => void;
}

function scoreVariant(score: number): "success" | "warning" | "danger" {
  if (score >= 70) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

export function ProductCard({ idea, isTop, onViewSpec }: Props) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-lg)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-12)] text-[var(--text-muted)] font-medium">
            #{idea.rank}
          </span>
          <h3 className="text-[var(--text-16)] font-medium text-[var(--text-primary)]">
            {idea.title}
          </h3>
        </div>
        <Badge variant={scoreVariant(idea.opportunity_score)}>
          {idea.opportunity_score}
        </Badge>
      </div>

      <p className="text-[var(--text-14)] text-[var(--text-secondary)] leading-relaxed">
        {idea.pitch}
      </p>

      <div className="text-[var(--text-12)] text-[var(--text-muted)]">
        For: {idea.target_user}
      </div>

      {isTop && onViewSpec && (
        <button
          onClick={onViewSpec}
          className="mt-1 text-[var(--text-12)] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors text-left"
        >
          View full spec
        </button>
      )}
    </div>
  );
}
