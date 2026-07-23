/**
 * Platform service-fee math (buyer-side, founding rate).
 * All amounts are in the smallest currency unit (cents) to avoid float drift.
 *
 * Rules (from Master Plan §7.3):
 *   - 5% founding rate
 *   - minimum €1.50
 *   - cap/taper on high-value trips (default cap €35.00)
 */

export interface FeeConfig {
  ratePct: number; // e.g. 5
  minCents: number; // e.g. 150
  capCents: number; // e.g. 3500
}

export const DEFAULT_FEE: FeeConfig = { ratePct: 5, minCents: 150, capCents: 3500 };

/** Platform fee added on top of the trip price, in cents. */
export function computePlatformFee(amountCents: number, cfg: FeeConfig = DEFAULT_FEE): number {
  if (amountCents <= 0) return 0;
  const raw = Math.round((amountCents * cfg.ratePct) / 100);
  return Math.min(Math.max(raw, cfg.minCents), cfg.capCents);
}

/** What the hiker pays at checkout (trip price + service fee). */
export function computeHikerTotal(amountCents: number, cfg: FeeConfig = DEFAULT_FEE): number {
  return amountCents + computePlatformFee(amountCents, cfg);
}

/**
 * Proportional split of the platform fee across a deposit + balance schedule,
 * so refunds stay clean. Returns fee-in-cents for each leg.
 */
export function splitFeeAcrossSchedule(
  amountCents: number,
  depositCents: number,
  cfg: FeeConfig = DEFAULT_FEE,
): { depositFee: number; balanceFee: number } {
  const total = computePlatformFee(amountCents, cfg);
  if (amountCents <= 0) return { depositFee: 0, balanceFee: 0 };
  const depositFee = Math.round((total * depositCents) / amountCents);
  return { depositFee, balanceFee: total - depositFee };
}
