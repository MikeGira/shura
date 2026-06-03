import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-[var(--text-12)] font-medium rounded-[var(--radius-sm)]",
        variant === "default" && "bg-[var(--bg-active)] text-[var(--text-secondary)]",
        variant === "success" && "bg-[var(--success)]/15 text-[var(--success)]",
        variant === "warning" && "bg-[var(--warning)]/15 text-[var(--warning)]",
        variant === "danger" && "bg-[var(--danger)]/15 text-[var(--danger)]",
        variant === "accent" && "bg-[var(--accent)]/15 text-[var(--accent)]",
        className
      )}
    >
      {children}
    </span>
  );
}
