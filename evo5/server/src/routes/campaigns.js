import { Router } from 'express';
import CampaignRequest from '../models/CampaignRequest.js';
import MatchProposal from '../models/MatchProposal.js';
import User from '../models/User.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { categorize, fairRate, simulate, makeReference, fitScore } from '../lib/aiOracle.js';
import { suggestedOffer } from '../lib/pricing.js';

const router = Router();

/**
 * STEP 1 & 2 of the Zero-Contact flow:
 * Request ingestion -> AI auto-categorisation -> identity masking behind a reference code.
 */
router.post('/', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const { title, brief, participantType, region = 'Global', budget, minFollowers = 0, deliverables = '', currency = 'INR' } = req.body;
    if (!title || !brief || !participantType || !budget) {
      return res.status(400).json({ error: 'title, brief, participantType and budget are required' });
    }

    const ai = categorize(`${title} ${brief} ${deliverables}`);
    const rate = fairRate({ budget, category: ai.category, region, minFollowers });
    const sim = simulate({ minFollowers, category: ai.category }, []);

    const campaign = await CampaignRequest.create({
      reference: makeReference(region),
      customer: req.user._id,
      title, brief, participantType, region, budget, currency, minFollowers, deliverables,
      category: ai.category,
      aiTags: ai.tags,
      urgency: ai.urgency,
      fairRateLow: rate.low,
      fairRateHigh: rate.high,
      predictedReach: sim.reach,
      predictedEngagements: sim.engagements,
      predictedConversions: sim.conversions,
    });

    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Customers see their own requests; admin sees everything. */
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { customer: req.user._id };
    const campaigns = await CampaignRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const campaign = await CampaignRequest.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (req.user.role !== 'admin' && campaign.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your campaign' });
    }
    const proposals = await MatchProposal.find({ campaign: campaign._id })
      .populate('participant')
      .lean({ virtuals: false });

    // Customers only ever see blind data until the proposal unlocks
    const shaped = proposals.map((p) => shapeProposal(p, req.user.role));
    res.json({ campaign, proposals: shaped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * STEP 3: AI Evaluation & Filtering.
 * Returns anonymous candidates ranked by predictive fit — admin-only view.
 */
router.get('/:id/candidates', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const campaign = await CampaignRequest.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const pool = await User.find({
      role: campaign.participantType,
      quarantined: false,
      status: 'active',
    });

    const existing = await MatchProposal.find({ campaign: campaign._id }).distinct('participant');
    const existingIds = new Set(existing.map((e) => e.toString()));

    const ranked = pool
      .map((u) => ({ user: u, score: fitScore(campaign, u) }))
      .filter((r) => !existingIds.has(r.user._id.toString()))
      // Sentiment gate: never surface brand-unsafe talent to corporate clients
      .filter((r) => (r.user.brandSafetyScore ?? 100) >= 55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((r, i) => ({
        ...r.user.toBlind(),
        fitScore: r.score,
        authenticityScore: r.user.authenticityScore, // admin-only field
        brandSafetyScore: r.user.brandSafetyScore,
        suggestedOffer: suggestedOffer(campaign, r.user, r.score),
      }));

    const sim = simulate(campaign, ranked.length ? pool.slice(0, 3) : []);
    res.json({ candidates: ranked, simulation: sim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export function shapeProposal(p, viewerRole, viewerIsParticipant = false) {
  const unlocked = p.identitiesUnlocked;
  const base = {
    id: p._id,
    campaign: p.campaign,
    fitScore: p.fitScore,
    offerAmount: p.offerAmount,
    status: p.status,
    customerAccepted: p.customerAccepted,
    participantAccepted: p.participantAccepted,
    identitiesUnlocked: unlocked,
    participantAlias: p.participantAlias,
    customerAlias: p.customerAlias,
    createdAt: p.createdAt,
  };

  const part = p.participant;
  if (part && typeof part === 'object') {
    base.participantSummary = {
      niche: part.niche,
      region: part.region,
      tier: part.tier,
      engagementRate: part.engagementRate,
      completedCampaigns: part.completedCampaigns,
    };
    // Real identity is revealed ONLY after mutual acceptance (or to admin).
    if (unlocked || viewerRole === 'admin') {
      base.participantIdentity = { name: part.name, email: part.email, followers: part.followers };
    }
    if (viewerRole === 'admin') base.authenticityScore = part.authenticityScore;
  }
  return base;
}

export default router;
