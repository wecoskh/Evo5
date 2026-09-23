/**
 * Per-participant dynamic offer calculation.
 *
 * The FairRate band describes the CAMPAIGN as a whole. This narrows it to a
 * single number for ONE participant, so a 96%-fit Diamond creator and a
 * 61%-fit Bronze creator never quote the same price.
 *
 * Design note: a creator's base rate is treated as a *weighted signal*, not a
 * hard floor. Premium talent often lists a rate above a given campaign budget;
 * hard-flooring on it would pin every candidate to the budget ceiling and
 * destroy price differentiation.
 */
export function suggestedOffer(campaign, user, fit) {
  const budget = campaign.budget || 0;
  const floor = budget * 0.5;
  const ceiling = budget * 0.92;

  // Where the wider market sits, expressed inside this campaign's rails.
  const benchLow = clamp(campaign.fairRateLow || floor, floor, ceiling);
  const benchHigh = clamp(campaign.fairRateHigh || ceiling, benchLow, ceiling);

  // Position inside the band: fit (70%) + authenticity (30%).
  const fitPos = clamp01((fit - 50) / 45);
  const authPos = clamp01(((user.authenticityScore || 0) - 70) / 30);
  const pos = fitPos * 0.7 + authPos * 0.3;

  const marketPrice = benchLow + (benchHigh - benchLow) * pos;

  // The creator's own asking price, capped to what this campaign can pay.
  const askingPrice = Math.min((user.baseRate || marketPrice) * 0.95, ceiling);

  // Blend: market benchmark dominates, asking price informs.
  let offer = marketPrice * 0.65 + askingPrice * 0.35;

  // Tier premium for proven talent.
  const premium = { Bronze: 0.97, Silver: 1.0, Gold: 1.04, Platinum: 1.09, Diamond: 1.15 };
  offer *= premium[user.tier] || 1;

  offer = clamp(offer, floor, ceiling);
  return Math.round(offer / 500) * 500; // clean negotiating figure
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clamp01 = (v) => clamp(v, 0, 1);
