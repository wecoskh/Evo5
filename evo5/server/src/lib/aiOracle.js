/**
 * EvO5-GPT — AI Mediation Oracle (deterministic simulation)
 *
 * Implements the four Oracle functions described in the blueprint:
 *   1. Auto-categorisation (NLP-style keyword parsing of an unstructured brief)
 *   2. Predictive matching (weighted fit score, 0-100)
 *   3. Dynamic pricing / FairRate engine
 *   4. Campaign simulation (reach / engagement / conversions)
 *
 * No external LLM call is required, so the platform runs fully offline.
 */

const CATEGORY_KEYWORDS = {
  Travel: ['travel', 'hotel', 'resort', 'villa', 'tourism', 'stay', 'trip', 'getaway', 'goa'],
  Food: ['restaurant', 'food', 'dining', 'cafe', 'menu', 'chef', 'cuisine', 'tasting'],
  Fashion: ['fashion', 'apparel', 'clothing', 'style', 'outfit', 'wear', 'boutique'],
  Beauty: ['beauty', 'skincare', 'cosmetic', 'makeup', 'salon', 'grooming'],
  Tech: ['tech', 'app', 'gadget', 'software', 'saas', 'device', 'ai', 'startup'],
  Fitness: ['fitness', 'gym', 'wellness', 'yoga', 'health', 'workout', 'nutrition'],
  Social: ['ngo', 'volunteer', 'cause', 'csr', 'donation', 'awareness', 'community', 'charity'],
  Research: ['survey', 'research', 'data', 'polling', 'mystery shopping', 'field', 'audit'],
  Retail: ['retail', 'store', 'ecommerce', 'shopify', 'dtc', 'product launch'],
};

const URGENCY_KEYWORDS = {
  high: ['urgent', 'asap', 'immediately', 'this week', 'rush', 'launch day'],
  low: ['flexible', 'no rush', 'whenever', 'long term', 'evergreen'],
};

const REGION_SEASONALITY = {
  Goa: 1.25, Mumbai: 1.15, Delhi: 1.12, Bengaluru: 1.1, Kerala: 1.08,
  Dubai: 1.3, Singapore: 1.28, London: 1.35, 'New York': 1.4, Global: 1.0,
};

const CATEGORY_DEMAND = {
  Travel: 1.2, Food: 1.05, Fashion: 1.15, Beauty: 1.18, Tech: 1.25,
  Fitness: 1.0, Social: 0.75, Research: 0.85, Retail: 1.1, General: 1.0,
};

/** 1. Auto-categorisation — parse an unstructured brief into structured tags. */
export function categorize(text = '') {
  const lower = text.toLowerCase();
  const tags = [];
  let category = 'General';
  let best = 0;

  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = words.filter((w) => lower.includes(w)).length;
    if (hits > 0) tags.push(cat);
    if (hits > best) { best = hits; category = cat; }
  }

  let urgency = 'standard';
  if (URGENCY_KEYWORDS.high.some((w) => lower.includes(w))) urgency = 'high';
  else if (URGENCY_KEYWORDS.low.some((w) => lower.includes(w))) urgency = 'low';

  return { category, tags: tags.length ? tags : ['General'], urgency };
}

/** 3. FairRate Engine — dynamic fair-market band for a campaign. */
export function fairRate({ budget, category = 'General', region = 'Global', minFollowers = 0 }) {
  const seasonality = REGION_SEASONALITY[region] ?? 1.0;
  const demand = CATEGORY_DEMAND[category] ?? 1.0;
  const reachFactor = 1 + Math.min(minFollowers, 1_000_000) / 2_000_000;

  const centre = budget * 0.9 * ((seasonality + demand) / 2) * reachFactor;
  return {
    low: Math.round(centre * 0.8),
    high: Math.round(centre * 1.15),
    seasonality,
    demand,
  };
}

/** 2. Predictive Matching — weighted fit score between a campaign and a participant. */
export function fitScore(campaign, user) {
  let score = 0;

  // Niche / category alignment (30)
  const cat = (campaign.category || '').toLowerCase();
  const niche = (user.niche || '').toLowerCase();
  if (niche && cat && (niche.includes(cat) || cat.includes(niche))) score += 30;
  else if ((campaign.aiTags || []).some((t) => t.toLowerCase() === niche)) score += 24;
  else score += 10;

  // Region alignment (15)
  if (user.region === campaign.region) score += 15;
  else if (user.region === 'Global' || campaign.region === 'Global') score += 9;
  else score += 4;

  // Reach requirement (20)
  const req = campaign.minFollowers || 0;
  if (req === 0) score += 14;
  else if (user.followers >= req * 2) score += 20;
  else if (user.followers >= req) score += 17;
  else if (user.followers >= req * 0.7) score += 8;

  // Authenticity — the anti-fraud weight (20)
  score += Math.round((user.authenticityScore / 100) * 20);

  // Engagement quality (10)
  score += Math.min(10, Math.round((user.engagementRate || 0) * 2));

  // Track record (5)
  score += Math.min(5, Math.round((user.completedCampaigns || 0) / 4));

  return Math.max(0, Math.min(100, score));
}

/** 4. Predictive Campaign Simulator — forecast before any capital is committed. */
export function simulate(campaign, participants = []) {
  if (!participants.length) {
    const est = Math.round((campaign.minFollowers || 10000) * 1.4);
    return { reach: est, engagements: Math.round(est * 0.035), conversions: Math.round(est * 0.006) };
  }
  const reach = participants.reduce((s, p) => s + p.followers * 0.42, 0);
  const engagements = participants.reduce(
    (s, p) => s + p.followers * 0.42 * ((p.engagementRate || 2) / 100), 0
  );
  return {
    reach: Math.round(reach),
    engagements: Math.round(engagements),
    conversions: Math.round(engagements * 0.11),
  };
}

/** "Proof of Reach" — engagement fingerprinting to derive a 0-100 Authenticity Score. */
export function authenticityScore({ followers = 0, engagementRate = 0, accountAgeMonths = 12, genericCommentRatio = 0.1, followerGeoSpread = 0.6 }) {
  let score = 50;

  // Healthy engagement band varies inversely with audience size
  const expected = followers > 500_000 ? 1.5 : followers > 100_000 ? 2.5 : 4;
  const ratio = engagementRate / expected;
  if (ratio >= 0.8 && ratio <= 2.2) score += 22;
  else if (ratio > 2.2) score -= 12; // suspiciously high => engagement pods
  else score += Math.round(ratio * 12);

  score += Math.min(12, Math.round(accountAgeMonths / 4));
  score -= Math.round(genericCommentRatio * 45); // "Nice pic!" bot comments
  score += Math.round(followerGeoSpread * 18); // coherent geography

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Sentiment Analysis / Brand Safety (blueprint §4A).
 * Scans a creator's historical content archive for controversy markers before
 * matching them with corporate entities.
 */
const RISK_MARKERS = {
  hate: { words: ['slur', 'hate speech', 'racist', 'bigot'], weight: 40 },
  controversy: { words: ['scandal', 'lawsuit', 'boycott', 'cancelled', 'feud', 'drama'], weight: 18 },
  profanity: { words: ['profanity', 'explicit', 'nsfw', 'vulgar'], weight: 12 },
  substances: { words: ['alcohol', 'vape', 'gambling', 'tobacco'], weight: 10 },
  misinformation: { words: ['conspiracy', 'misinformation', 'fake news', 'debunked'], weight: 22 },
};

export function brandSafety(contentArchive = []) {
  const corpus = (Array.isArray(contentArchive) ? contentArchive.join(' ') : String(contentArchive)).toLowerCase();
  const flags = [];
  let penalty = 0;

  for (const [category, { words, weight }] of Object.entries(RISK_MARKERS)) {
    const hits = words.filter((w) => corpus.includes(w));
    if (hits.length) {
      penalty += weight * Math.min(hits.length, 3);
      flags.push({ category, matches: hits, severity: weight >= 22 ? 'high' : weight >= 12 ? 'medium' : 'low' });
    }
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));
  return {
    score,
    flags,
    verdict: score >= 80 ? 'safe' : score >= 55 ? 'review' : 'blocked',
    corporateSafe: score >= 80,
  };
}

/** Blind alias generation for the Zero-Contact protocol. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function participantAlias(role, index) {
  const label = { influencer: 'Creator', celebrity: 'Celebrity', volunteer: 'Volunteer', surveyor: 'Surveyor' }[role] || 'Participant';
  return `${label} ${ALPHABET[index % 26]}`;
}

export function customerAlias(campaign) {
  const cat = campaign.category && campaign.category !== 'General' ? campaign.category : 'Verified';
  return `${cat} Brand`;
}

/** Anonymous request reference, e.g. "Goa-2847". */
export function makeReference(region = 'Global') {
  const slug = (region || 'GLB').replace(/[^A-Za-z]/g, '').slice(0, 4) || 'GLB';
  return `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Simulated Polygon transaction hash for escrow milestone releases. */
export function fakeTxHash() {
  const hex = '0123456789abcdef';
  let s = '0x';
  for (let i = 0; i < 64; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}
