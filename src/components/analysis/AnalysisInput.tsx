"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  placeholder?: string;
  onAnalysisStart?: (id: string) => void;
}

export function AnalysisInput({ placeholder, onAnalysisStart }: Props) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError("");
    setProgress("Starting analysis...");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/dashboard`);
        return;
      }

      if (res.status === 429) {
        const data = await res.json();
        setError(data.message ?? "Rate limit reached. Try again later.");
        setLoading(false);
        setProgress("");
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error("Analysis failed. Please try again.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === "progress") {
              setProgress(data.step);
            } else if (currentEvent === "complete") {
              onAnalysisStart?.(data.analysis_id);
              router.push(`/analysis/${data.analysis_id}`);
              return;
            } else if (currentEvent === "error") {
              throw new Error(data.message);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          placeholder={
            placeholder ?? "Paste a YouTube URL or type a Reddit topic (e.g. r/personalfinance)"
          }
          disabled={loading}
          className="flex-1 h-10 px-4 text-[var(--text-14)] text-[var(--text-primary)] bg-[var(--bg-elev)] border border-[var(--border)] rounded-[var(--radius-md)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition-colors disabled:opacity-60"
        />
        <Button type="submit" loading={loading} disabled={!input.trim()}>
          Analyze
        </Button>
      </div>

      {progress && (
        <div className="flex items-center gap-2 text-[var(--text-12)] text-[var(--text-secondary)]">
          <span className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          {progress}
        </div>
      )}

      {error && (
        <p className="text-[var(--text-12)] text-[var(--danger)]">{error}</p>
      )}
    </form>
  );
}
