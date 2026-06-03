import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

async function updateUserPlan(
  userId: string,
  plan: string,
  stripeCustomerId: string,
  status: string
) {
  const service = await createServiceClient();

  const resolvedPlan = status === "active" || status === "trialing" ? plan : "free";

  await service
    .from("profiles")
    .update({
      plan: resolvedPlan,
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan ?? "pro";
      const customerId = session.customer as string;
      if (userId && customerId) {
        await updateUserPlan(userId, plan, customerId, "active");
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const service = await createServiceClient();
      const { data: profile } = await service
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", sub.customer as string)
        .single();

      if (profile) {
        const plan =
          event.type === "customer.subscription.deleted"
            ? "free"
            : (sub.metadata?.plan ?? "pro");
        await updateUserPlan(
          profile.id,
          plan,
          sub.customer as string,
          sub.status
        );
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
