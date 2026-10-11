import {
  FREE_FEATURES,
  type CheckoutResult,
  type Entitlement,
  type FeatureKey,
} from "@/types/commerce";

/**
 * Provider boundary: a future payment integration (server-side) implements this.
 * Nothing provider-specific lives outside an implementation of this interface.
 */
export interface CommerceProvider {
  readonly id: string;
  listEntitlements(): Promise<Entitlement[]>;
  startCheckout(productId: string): Promise<CheckoutResult>;
}

export const noCommerceProvider: CommerceProvider = {
  id: "none",
  async listEntitlements() {
    return [];
  },
  async startCheckout() {
    return { kind: "not_configured" };
  },
};

let provider: CommerceProvider = noCommerceProvider;

export function setCommerceProvider(p: CommerceProvider) {
  provider = p;
}

export function isFreeFeature(feature: FeatureKey) {
  return FREE_FEATURES.includes(feature);
}

export function hasAccess(feature: FeatureKey, entitlements: Entitlement[]) {
  if (isFreeFeature(feature)) return true;
  const now = Date.now();
  return entitlements.some(
    (e) => e.feature === feature && (!e.expiresAt || Date.parse(e.expiresAt) > now),
  );
}

export function listEntitlements() {
  return provider.listEntitlements();
}

export function startCheckout(productId: string) {
  return provider.startCheckout(productId);
}
