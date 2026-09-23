import { Router } from 'express';
import User from '../models/User.js';
import CampaignRequest from '../models/CampaignRequest.js';
import MatchProposal from '../models/MatchProposal.js';
import EscrowLedger from '../models/EscrowLedger.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { fairRate, simulate, categorize, authenticityScore, brandSafety } from '../lib/aiOracle.js';

const router = Router();

/** Public marketing counters for the landing page. */
router.get('/public', async (_req, res) => {
  try {
    const [influencers, celebrities, volunteers, surveyors, customers, campaigns, ledgers] =
      await Promise.all([
        User.countDocuments({ role: 'influencer' }),
        User.countDocuments({ role: 'celebrity' }),
        User.countDocuments({ role: 'volunteer' }),
        User.countDocuments({ role: 'surveyor' }),
        User.countDocuments({ role: 'customer' }),
        CampaignRequest.countDocuments(),
        EscrowLedger.find().select('totalAmount').lean(),
      ]);

    const escrowVolume = ledgers.reduce((s, l) => s + l.totalAmount, 0);
    const avgAuth = await User.aggregate([
      { $match: { role: { $in: ['influencer', 'celebrity'] } } },
      { $group: { _id: null, avg: { $avg: '$authenticityScore' } } },
    ]);

    res.json({
      participants: { influencers, celebrities, volunteers, surveyors },
      totalParticipants: influencers + celebrities + volunteers + surveyors,
      customers,
      campaigns,
      escrowVolume,
      avgAuthenticity: Math.round(avgAuth[0]?.avg || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Admin command-centre metrics. */
router.get('/admin', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const [pending, matched, quarantined, ledgers, campaigns] = await Promise.all([
      MatchProposal.countDocuments({ status: 'PENDING' }),
      MatchProposal.countDocuments({ status: 'MATCHED' }),
      User.countDocuments({ quarantined: true }),
      EscrowLedger.find().lean(),
      CampaignRequest.find().lean(),
    ]);

    const held = ledgers.reduce((s, l) => s + (l.totalAmount - l.releasedAmount), 0);
    const released = ledgers.reduce((s, l) => s + l.releasedAmount, 0);
    const revenue = ledgers.reduce((s, l) => s + (l.releasedAmount * l.platformFeePercent) / 100, 0);

    res.json({
      proposals: { pending, matched },
      quarantined,
      escrow: { held, released, revenue: Math.round(revenue) },
      campaigns: {
        total: campaigns.length,
        byStatus: campaigns.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Live AI tools exposed on the landing page (no auth) — FairRate + simulator + categoriser. */
router.post('/simulate', async (req, res) => {
  try {
    const { brief = '', budget = 50000, region = 'Global', minFollowers = 50000 } = req.body;
    const ai = categorize(brief);
    const rate = fairRate({ budget, category: ai.category, region, minFollowers });
    const sim = simulate({ minFollowers, category: ai.category }, []);
    res.json({ ai, rate, simulation: sim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/brand-safety', async (req, res) => {
  try {
    const { contentArchive = [] } = req.body || {};
    res.json(brandSafety(contentArchive));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/authenticity', async (req, res) => {
  try {
    const score = authenticityScore(req.body || {});
    res.json({ score, quarantined: score < 75 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
