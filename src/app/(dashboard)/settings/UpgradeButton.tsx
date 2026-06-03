"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/stripe/client";

export function UpgradeButton({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleUpgrade} loading={loading} className="w-full">
      Upgrade to Pro
    </Button>
  );
}
