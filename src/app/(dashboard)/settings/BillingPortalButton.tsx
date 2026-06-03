"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handlePortal} loading={loading}>
      Manage billing
    </Button>
  );
}
