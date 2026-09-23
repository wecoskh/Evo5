import { Router } from 'express';
import MatchProposal from '../models/MatchProposal.js';
import CampaignRequest from '../models/CampaignRequest.js';
import EscrowLedger, { MILESTONE_TEMPLATE } from '../models/EscrowLedger.js';
import User from '../models/User.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { fitScore, participantAlias, customerAlias, fakeTxHash } from '../lib/aiOracle.js';
import { suggestedOffer } from '../lib/pricing.js';
import { shapeProposal } from './campaigns.js';

const router = Router();

/**
 * STEP 4: Blind Proposal Dispatch (admin only).
 * The participant is told the category and payout — never the brand.
 * The customer is shown "Creator A" — never the real name.
 */
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { campaignId, participantId, offerAmount } = req.body;
    const campaign = await CampaignRequest.findById(campaignId);
    const participant = await User.findById(participantId);
    if (!campaign || !participant) return res.status(404).json({ error: 'Campaign or participant not found' });
    if (participant.quarantined) {
      return res.status(400).json({ error: 'Participant is quarantined by the anti-fraud engine' });
    }
    if ((participant.brandSafetyScore ?? 100) < 55) {
      return res.status(400).json({ error: 'Participant blocked by the brand-safety sentiment scan' });
    }

    const count = await MatchProposal.countDocuments({ campaign: campaign._id });
    const score = fitScore(campaign, participant);
    const amount = offerAmount ?? suggestedOffer(campaign, participant, score);

    const proposal = await MatchProposal.create({
      campaign: campaign._id,
      participant: participant._id,
      participantAlias: participantAlias(participant.role, count),
      customerAlias: customerAlias(campaign),
      fitScore: score,
      offerAmount: amount,
    });

    if (campaign.status === 'ingested') {
      campaign.status = 'matching';
      await campaign.save();
    }

    res.status(201).json({ proposal });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Proposal already sent to this participant' });
    res.status(500).json({ error: err.message });
  }
});

/** A participant's blind inbox — brand identity withheld. */
router.get('/inbox', authenticate, requireRole('influencer', 'celebrity', 'volunteer', 'surveyor'), async (req, res) => {
  try {
    const proposals = await MatchProposal.find({ participant: req.user._id })
      .populate('campaign')
      .sort({ createdAt: -1 })
      .lean();

    const shaped = proposals.map((p) => {
      const c = p.campaign || {};
      return {
        id: p._id,
        reference: c.reference,
        category: c.category,
        region: c.region,
        deliverables: c.deliverables,
        participantType: c.participantType,
        // Brief is shown, but brand identity is masked until unlock
        brief: p.identitiesUnlocked ? c.brief : maskBrief(c.brief),
        customerAlias: p.customerAlias,
        offerAmount: p.offerAmount,
        fitScore: p.fitScore,
        status: p.status,
        participantAccepted: p.participantAccepted,
        customerAccepted: p.customerAccepted,
        identitiesUnlocked: p.identitiesUnlocked,
        createdAt: p.createdAt,
      };
    });
    res.json({ proposals: shaped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * STEP 5: Commitment & Escrow Activation.
 * When BOTH sides accept, identities unlock and the escrow contract is funded.
 */
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const proposal = await MatchProposal.findById(req.params.id).populate('campaign participant');
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status === 'REJECTED') return res.status(400).json({ error: 'Proposal was rejected' });

    const campaign = proposal.campaign;
    const isParticipant = proposal.participant._id.toString() === req.user._id.toString();
    const isCustomer = campaign.customer.toString() === req.user._id.toString();

    if (isParticipant) proposal.participantAccepted = true;
    else if (isCustomer) proposal.customerAccepted = true;
    else return res.status(403).json({ error: 'You are not party to this proposal' });

    let escrow = null;
    if (proposal.customerAccepted && proposal.participantAccepted && proposal.status !== 'MATCHED') {
      proposal.status = 'MATCHED';
      proposal.identitiesUnlocked = true; // the reveal

      escrow = await EscrowLedger.create({
        campaign: campaign._id,
        proposal: proposal._id,
        customer: campaign.customer,
        participant: proposal.participant._id,
        totalAmount: proposal.offerAmount,
        currency: campaign.currency,
        contractAddress: fakeTxHash().slice(0, 42),
        milestones: MILESTONE_TEMPLATE.map((m) => ({
          ...m,
          amount: Math.round((proposal.offerAmount * m.percent) / 100),
        })),
      });

      campaign.status = 'in_progress';
      await campaign.save();

      // Reject other pending proposals on this campaign
      await MatchProposal.updateMany(
        { campaign: campaign._id, _id: { $ne: proposal._id }, status: 'PENDING' },
        { status: 'REJECTED', rejectionReason: 'Campaign matched with another participant' }
      );
    }

    await proposal.save();
    res.json({ proposal: shapeProposal(proposal.toObject(), req.user.role), escrow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const proposal = await MatchProposal.findById(req.params.id).populate('campaign');
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const isParticipant = proposal.participant.toString() === req.user._id.toString();
    const isCustomer = proposal.campaign.customer.toString() === req.user._id.toString();
    if (!isParticipant && !isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not party to this proposal' });
    }

    proposal.status = 'REJECTED';
    proposal.rejectionReason = req.body.reason || 'Declined';
    await proposal.save();
    res.json({ proposal: { id: proposal._id, status: proposal.status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function maskBrief(brief = '') {
  // Strip anything that looks like a brand name, URL, email or handle.
  return brief
    .replace(/https?:\/\/\S+/gi, '[link withheld]')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/gi, '[email withheld]')
    .replace(/@[A-Za-z0-9_.]+/g, '[handle withheld]');
}

export default router;
