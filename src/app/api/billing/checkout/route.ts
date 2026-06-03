import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLANS } from "@/lib/stripe/client";
import type { Plan } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = body?.plan as Plan;

  if (plan !== "pro" && plan !== "builder") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : (profile?.email ?? user.email),
    line_items: [{ price: PLANS[plan].stripe_price_id, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/settings`,
    metadata: { user_id: user.id, plan },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
