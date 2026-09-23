import { Router } from 'express';
import EscrowLedger from '../models/EscrowLedger.js';
import CampaignRequest from '../models/CampaignRequest.js';
import User from '../models/User.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { fakeTxHash } from '../lib/aiOracle.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ customer: req.user._id }, { participant: req.user._id }] };

    const ledgers = await EscrowLedger.find(filter)
      .populate('campaign', 'reference title category currency')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ledgers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Milestone release — simulates the on-chain smart-contract trigger. */
router.post('/:id/release', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { milestoneKey } = req.body;
    const ledger = await EscrowLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ error: 'Escrow ledger not found' });

    if (ledger.status === 'disputed') {
      return res.status(409).json({ error: 'Contract is disputed — releases are frozen pending resolution' });
    }

    const milestone = ledger.milestones.find((m) => m.key === milestoneKey);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (milestone.released) return res.status(400).json({ error: 'Milestone already released' });

    milestone.released = true;
    milestone.releasedAt = new Date();
    milestone.txHash = fakeTxHash();

    ledger.releasedAmount += milestone.amount;
    const allDone = ledger.milestones.every((m) => m.released);
    ledger.status = allDone ? 'settled' : 'partially_released';
    await ledger.save();

    if (allDone) {
      await CampaignRequest.findByIdAndUpdate(ledger.campaign, { status: 'completed' });
      const participant = await User.findById(ledger.participant);
      if (participant) {
        participant.completedCampaigns += 1;
        participant.tier = tierFor(participant.completedCampaigns);
        await participant.save();
      }
    }

    res.json({ ledger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Reputation staking slash — bad actors lose their stake, customer is compensated. */
router.post('/:id/dispute', authenticate, async (req, res) => {
  try {
    const ledger = await EscrowLedger.findById(req.params.id);
    if (!ledger) return res.status(404).json({ error: 'Escrow ledger not found' });

    ledger.status = 'disputed';
    ledger.disputeNote = req.body.note || 'Dispute raised';
    await ledger.save();

    if (req.body.slashStake && req.user.role === 'admin') {
      const participant = await User.findById(ledger.participant);
      if (participant) {
        const slashed = Math.round(participant.stakedTokens * 0.5);
        participant.stakedTokens -= slashed;
        participant.authenticityScore = Math.max(0, participant.authenticityScore - 20);
        participant.quarantined = participant.authenticityScore < 75;
        await participant.save();
        return res.json({ ledger, slashed, participant: participant.toPublic() });
      }
    }
    res.json({ ledger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function tierFor(n) {
  if (n >= 40) return 'Diamond';
  if (n >= 25) return 'Platinum';
  if (n >= 12) return 'Gold';
  if (n >= 5) return 'Silver';
  return 'Bronze';
}

export default router;
