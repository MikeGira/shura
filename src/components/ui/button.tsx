"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)] disabled:opacity-50 disabled:cursor-not-allowed",
          size === "sm" && "text-[var(--text-12)] px-3 h-7 rounded-[var(--radius-sm)] gap-1.5",
          size === "md" && "text-[var(--text-14)] px-4 h-9 rounded-[var(--radius-md)] gap-2",
          variant === "primary" && "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
          variant === "secondary" && "bg-[var(--bg-elev)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]",
          variant === "ghost" && "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
          variant === "danger" && "bg-[var(--danger)] text-white hover:opacity-90",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
