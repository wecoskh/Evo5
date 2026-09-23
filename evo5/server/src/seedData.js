import User from './models/User.js';
import CampaignRequest from './models/CampaignRequest.js';
import MatchProposal from './models/MatchProposal.js';
import EscrowLedger, { MILESTONE_TEMPLATE } from './models/EscrowLedger.js';
import {
  categorize, fairRate, simulate, makeReference, fitScore,
  participantAlias, customerAlias, authenticityScore, fakeTxHash, brandSafety,
} from './lib/aiOracle.js';
import { suggestedOffer } from './lib/pricing.js';

const PASSWORD = 'evo5demo';

const INFLUENCERS = [
  ['Aarav Menon', 'Travel', 'Goa', ['Instagram', 'YouTube'], 182000, 4.6, 42000, 24],
  ['Diya Kapoor', 'Travel', 'Kerala', ['Instagram', 'TikTok'], 96000, 5.2, 28000, 31],
  ['Rohan Shetty', 'Food', 'Bengaluru', ['Instagram'], 143000, 3.9, 35000, 18],
  ['Meera Nair', 'Fashion', 'Mumbai', ['Instagram', 'YouTube'], 410000, 3.1, 88000, 44],
  ['Kabir Rao', 'Tech', 'Bengaluru', ['YouTube', 'X'], 265000, 4.4, 76000, 12],
  ['Ananya Iyer', 'Beauty', 'Mumbai', ['Instagram', 'TikTok'], 78000, 6.1, 22000, 9],
  ['Vikram Desai', 'Fitness', 'Delhi', ['Instagram', 'YouTube'], 121000, 4.0, 31000, 15],
  ['Sana Qureshi', 'Travel', 'Dubai', ['Instagram'], 534000, 2.8, 120000, 27],
  ['Nikhil Bose', 'Food', 'Goa', ['Instagram', 'YouTube'], 61000, 5.8, 18000, 21],
  ['Tara Fernandes', 'Retail', 'Goa', ['Instagram'], 54000, 4.9, 16000, 7],
];

const CELEBRITIES = [
  ['Arjun Kohli', 'Film', 'Mumbai', ['Instagram'], 8400000, 2.2, 2500000, 11],
  ['Priya Balan', 'Film', 'Chennai', ['Instagram', 'X'], 5100000, 2.6, 1800000, 8],
  ['Rishi Sandhu', 'Sports', 'Delhi', ['Instagram'], 12800000, 1.9, 3600000, 14],
];

const VOLUNTEERS = [
  ['Ishaan Gupta', 'Social', 'Bengaluru', 3200, 7.4, 0, 19],
  ['Lakshmi Pillai', 'Social', 'Kerala', 1800, 8.1, 0, 26],
  ['Farhan Ali', 'Social', 'Mumbai', 2400, 6.9, 0, 13],
];

const SURVEYORS = [
  ['Neha Sharma', 'Research', 'Goa', 900, 0, 12000, 33],
  ['Aditya Verma', 'Research', 'Mumbai', 1400, 0, 15000, 22],
  ['Ritu Chandra', 'Research', 'Bengaluru', 1100, 0, 13500, 17],
];

export async function seedDatabase() {
  if ((await User.countDocuments()) > 0) {
    console.log('[seed] database already populated, skipping');
    return;
  }
  console.log('[seed] populating demo data…');

  const mk = async (data) => {
    const u = new User(data);
    await u.setPassword(PASSWORD);
    await u.save();
    return u;
  };

  // ---- Admin ----
  await mk({ name: 'EvO5 Control', email: 'admin@evo5.io', role: 'admin', region: 'Global' });

  // ---- Customers ----
  const customers = await Promise.all([
    mk({ name: 'Isabella Rosario', email: 'hotel@evo5.io', role: 'customer', company: 'Villa Serena Goa', industry: 'Hospitality', region: 'Goa' }),
    mk({ name: 'Daniel Okafor', email: 'brand@evo5.io', role: 'customer', company: 'Nuvo Skincare', industry: 'DTC Beauty', region: 'Mumbai' }),
    mk({ name: 'Grace Lin', email: 'ngo@evo5.io', role: 'customer', company: 'CleanSeas Foundation', industry: 'NGO', region: 'Kerala' }),
  ]);

  // ---- Participants ----
  const CLEAN_ARCHIVE = ['sunset villa tour', 'morning routine', 'behind the scenes', 'travel tips thread'];
  const RISKY_ARCHIVE = ['public feud with another creator', 'boycott callout thread', 'gambling sponsorship promo'];

  const participants = [];
  let idx = 0;
  for (const [name, niche, region, platforms, followers, er, rate, done] of INFLUENCERS) {
    const archive = idx === 5 ? RISKY_ARCHIVE : CLEAN_ARCHIVE;
    const safety = brandSafety(archive);
    participants.push(await mk({
      contentArchive: archive,
      brandSafetyScore: safety.score,
      brandSafetyFlags: safety.flags.map((f) => f.category),
      name, email: `creator${++idx}@evo5.io`, role: 'influencer', niche, region, platforms,
      followers, engagementRate: er, baseRate: rate, completedCampaigns: done,
      codename: participantAlias('influencer', idx - 1),
      authenticityScore: authenticityScore({ followers, engagementRate: er, accountAgeMonths: 30 + idx, genericCommentRatio: idx === 4 ? 0.55 : 0.08 }),
      stakedTokens: 500 + done * 25,
      tier: tierFor(done),
    }));
  }
  idx = 0;
  for (const [name, niche, region, platforms, followers, er, rate, done] of CELEBRITIES) {
    participants.push(await mk({
      name, email: `celeb${++idx}@evo5.io`, role: 'celebrity', niche, region, platforms,
      followers, engagementRate: er, baseRate: rate, completedCampaigns: done,
      codename: participantAlias('celebrity', idx - 1),
      authenticityScore: authenticityScore({ followers, engagementRate: er, accountAgeMonths: 60 }),
      stakedTokens: 5000, tier: tierFor(done),
    }));
  }
  idx = 0;
  for (const [name, niche, region, followers, er, rate, done] of VOLUNTEERS) {
    participants.push(await mk({
      name, email: `volunteer${++idx}@evo5.io`, role: 'volunteer', niche, region,
      platforms: ['Instagram'], followers, engagementRate: er, baseRate: rate, completedCampaigns: done,
      codename: participantAlias('volunteer', idx - 1),
      authenticityScore: 88 + (idx % 5), stakedTokens: 100, tier: tierFor(done),
    }));
  }
  idx = 0;
  for (const [name, niche, region, followers, er, rate, done] of SURVEYORS) {
    participants.push(await mk({
      name, email: `surveyor${++idx}@evo5.io`, role: 'surveyor', niche, region,
      platforms: [], followers, engagementRate: er, baseRate: rate, completedCampaigns: done,
      codename: participantAlias('surveyor', idx - 1),
      authenticityScore: 90 + (idx % 6), stakedTokens: 250, tier: tierFor(done),
    }));
  }

  // Quarantine anyone the anti-fraud engine flags below 75
  for (const p of participants) {
    if (p.authenticityScore < 75 && !p.quarantined) { p.quarantined = true; await p.save(); }
  }

  // ---- Campaigns (the Goa villa scenario straight from the blueprint) ----
  const campaignSeeds = [
    {
      customer: customers[0],
      title: 'Promote luxury villa amenities',
      brief: 'Boutique hotel in Goa looking to promote luxury villa amenities and the new infinity pool. Seeking travel creators with 50K+ real reach for a 3-post package during peak season.',
      participantType: 'influencer', region: 'Goa', budget: 50000, minFollowers: 50000,
      deliverables: '3 Instagram posts + 5 stories',
    },
    {
      customer: customers[1],
      title: 'Skincare serum launch',
      brief: 'DTC beauty brand launching a vitamin-C serum. Need beauty creators for authentic review content with Shopify UTM attribution tracking.',
      participantType: 'influencer', region: 'Mumbai', budget: 80000, minFollowers: 70000,
      deliverables: '2 reels + 1 static review post',
    },
    {
      customer: customers[2],
      title: 'Coastal cleanup awareness drive',
      brief: 'NGO running a community beach cleanup CSR campaign. Looking for volunteers for on-ground advocacy and impact tracking.',
      participantType: 'volunteer', region: 'Kerala', budget: 25000, minFollowers: 0,
      deliverables: 'On-ground participation + impact report',
    },
    {
      customer: customers[1],
      title: 'Retail footfall mystery shopping',
      brief: 'Need field researchers for mystery shopping and consumer polling across 12 retail outlets with location verification.',
      participantType: 'surveyor', region: 'Mumbai', budget: 45000, minFollowers: 0,
      deliverables: '12 store audits + data sheets',
    },
  ];

  const campaigns = [];
  for (const s of campaignSeeds) {
    const ai = categorize(`${s.title} ${s.brief} ${s.deliverables}`);
    const rate = fairRate({ budget: s.budget, category: ai.category, region: s.region, minFollowers: s.minFollowers });
    const sim = simulate({ minFollowers: s.minFollowers, category: ai.category }, []);
    campaigns.push(await CampaignRequest.create({
      reference: makeReference(s.region),
      customer: s.customer._id,
      title: s.title, brief: s.brief, participantType: s.participantType,
      region: s.region, budget: s.budget, minFollowers: s.minFollowers,
      deliverables: s.deliverables, category: ai.category, aiTags: ai.tags, urgency: ai.urgency,
      fairRateLow: rate.low, fairRateHigh: rate.high,
      predictedReach: sim.reach, predictedEngagements: sim.engagements, predictedConversions: sim.conversions,
      status: 'matching',
    }));
  }

  // ---- Blind proposals on the Goa campaign ----
  const goa = campaigns[0];
  const goaPool = participants
    .filter((p) => p.role === 'influencer' && !p.quarantined)
    .map((p) => ({ p, score: fitScore(goa, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  let pi = 0;
  const goaProposals = [];
  for (const { p, score } of goaPool) {
    goaProposals.push(await MatchProposal.create({
      campaign: goa._id, participant: p._id,
      participantAlias: participantAlias('influencer', pi++),
      customerAlias: customerAlias(goa),
      fitScore: score,
      offerAmount: suggestedOffer(goa, p, score),
    }));
  }

  // First proposal is fully matched -> escrow funded, first milestone released
  const matched = goaProposals[0];
  matched.customerAccepted = true;
  matched.participantAccepted = true;
  matched.identitiesUnlocked = true;
  matched.status = 'MATCHED';
  await matched.save();

  goa.status = 'in_progress';
  await goa.save();

  const ledger = await EscrowLedger.create({
    campaign: goa._id, proposal: matched._id,
    customer: goa.customer, participant: matched.participant,
    totalAmount: matched.offerAmount, currency: 'INR',
    contractAddress: fakeTxHash().slice(0, 42),
    milestones: MILESTONE_TEMPLATE.map((m) => ({ ...m, amount: Math.round((matched.offerAmount * m.percent) / 100) })),
  });
  ledger.milestones[0].released = true;
  ledger.milestones[0].releasedAt = new Date();
  ledger.milestones[0].txHash = fakeTxHash();
  ledger.releasedAmount = ledger.milestones[0].amount;
  ledger.status = 'partially_released';
  await ledger.save();

  // A couple of pending proposals on the beauty campaign
  const beauty = campaigns[1];
  const beautyPool = participants
    .filter((p) => p.role === 'influencer' && !p.quarantined)
    .map((p) => ({ p, score: fitScore(beauty, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  pi = 0;
  for (const { p, score } of beautyPool) {
    await MatchProposal.create({
      campaign: beauty._id, participant: p._id,
      participantAlias: participantAlias('influencer', pi++),
      customerAlias: customerAlias(beauty),
      fitScore: score,
      offerAmount: suggestedOffer(beauty, p, score),
    });
  }

  console.log(`[seed] done — ${await User.countDocuments()} users, ${campaigns.length} campaigns`);
}

function tierFor(n) {
  if (n >= 40) return 'Diamond';
  if (n >= 25) return 'Platinum';
  if (n >= 12) return 'Gold';
  if (n >= 5) return 'Silver';
  return 'Bronze';
}
