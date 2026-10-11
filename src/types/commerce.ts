/** Features that can be gated. Listening and discovery are always free. */
export type FeatureKey = "live_listening" | "discovery" | "favorites" | "transcripts";

export const FREE_FEATURES: readonly FeatureKey[] = ["live_listening", "discovery", "favorites"];

export interface Product {
  id: string;
  name: string;
  grants: FeatureKey[];
  /** Price comes from the payment provider; never hardcoded here. */
  providerPriceId?: string | undefined;
}

export interface Entitlement {
  feature: FeatureKey;
  source: "free" | "purchase" | "subscription";
  expiresAt?: string | undefined;
}

export type CheckoutResult = { kind: "redirect"; url: string } | { kind: "not_configured" };
