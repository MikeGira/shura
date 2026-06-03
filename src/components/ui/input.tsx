"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <input
          ref={ref}
          className={clsx(
            "w-full h-9 px-3 text-[var(--text-14)] text-[var(--text-primary)] bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-md)] placeholder:text-[var(--text-muted)] transition-colors",
            "focus:outline-none focus:border-[var(--border-strong)]",
            error && "border-[var(--danger)]",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-[var(--text-12)] text-[var(--danger)]">{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
