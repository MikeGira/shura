import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    // No apiVersion pin: stripe-node uses the API version its types are built
    // against; pinning a literal here breaks the build on every SDK bump.
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

// Convenience alias for callers that want the old `stripe` name
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  free: { name: "Free", analyses_per_month: 3, price: 0 },
  pro: {
    name: "Pro",
    analyses_per_month: Infinity,
    price: 19,
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID ?? "",
  },
  builder: {
    name: "Builder",
    analyses_per_month: Infinity,
    price: 49,
    stripe_price_id: process.env.STRIPE_BUILDER_PRICE_ID ?? "",
  },
} as const;

export type Plan = keyof typeof PLANS;
