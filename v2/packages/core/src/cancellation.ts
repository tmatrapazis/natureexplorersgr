/**
 * Cancellation & refund engine (Master Plan §8.6).
 * Policies are organizer-configurable, grounded in real Greek market norms
 * (Trekkers, YouthTrekkin). Tiers say: "cancel at least N days before departure -> R% refund".
 *
 * The tier that applies is the one with the LARGEST days_before that is <= the
 * actual days-until-departure. If none qualifies, refund is 0%.
 */

export interface RefundTier {
  days_before: number; // threshold
  refund_pct: number; // 0..100
}

export type CancellationPreset =
  | "day_standard"
  | "multiday_standard"
  | "graduated"
  | "flexible"
  | "custom";

/** Preset tiers modelled on real organizer policies. */
export const CANCELLATION_PRESETS: Record<Exclude<CancellationPreset, "custom">, RefundTier[]> = {
  // Day hikes (Trekkers): >=7 days -> 100%, else 0%.
  day_standard: [{ days_before: 7, refund_pct: 100 }],
  // Multi-day (Trekkers): >=15 days -> 100%, else 0%.
  multiday_standard: [{ days_before: 15, refund_pct: 100 }],
  // Graduated (YouthTrekkin): >=15 -> 100%, 8..14 -> 50%, <=7 -> 0%.
  graduated: [
    { days_before: 15, refund_pct: 100 },
    { days_before: 8, refund_pct: 50 },
  ],
  // Flexible (drives bookings): full refund up to 48h before.
  flexible: [{ days_before: 2, refund_pct: 100 }],
};

/** Resolve the applicable refund percentage for a given lead time. */
export function refundPctForLeadTime(tiers: RefundTier[], daysUntilDeparture: number): number {
  const sorted = [...tiers].sort((a, b) => b.days_before - a.days_before);
  for (const tier of sorted) {
    if (daysUntilDeparture >= tier.days_before) return tier.refund_pct;
  }
  return 0;
}

export interface RefundInput {
  tiers: RefundTier[];
  daysUntilDeparture: number;
  amountPaidCents: number; // what the hiker actually paid so far (deposit and/or balance)
  platformFeePaidCents: number; // fee already collected
  feeFollowsRefund?: boolean; // default true
  organizerInitiated?: boolean; // organizer/weather cancel -> always 100% incl. fee
}

export interface RefundResult {
  refundPct: number;
  refundAmountCents: number; // trip-price portion refunded to hiker
  feeRefundCents: number; // platform fee refunded to hiker
  totalToHikerCents: number;
}

/** Compute the refund owed to the hiker for a cancellation. */
export function computeRefund(input: RefundInput): RefundResult {
  const feeFollows = input.feeFollowsRefund ?? true;

  const pct = input.organizerInitiated
    ? 100
    : refundPctForLeadTime(input.tiers, input.daysUntilDeparture);

  const refundAmountCents = Math.round((input.amountPaidCents * pct) / 100);

  // Organizer-initiated always returns the fee; otherwise fee is proportional (if enabled).
  const feeRefundCents = input.organizerInitiated
    ? input.platformFeePaidCents
    : feeFollows
      ? Math.round((input.platformFeePaidCents * pct) / 100)
      : 0;

  return {
    refundPct: pct,
    refundAmountCents,
    feeRefundCents,
    totalToHikerCents: refundAmountCents + feeRefundCents,
  };
}
