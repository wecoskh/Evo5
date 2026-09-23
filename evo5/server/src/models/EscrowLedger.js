import mongoose from 'mongoose';

// Milestone split straight from the blueprint: 30% draft / 40% live post / 30% attribution
export const MILESTONE_TEMPLATE = [
  { key: 'draft_approved', label: 'Content draft approved', percent: 30 },
  { key: 'post_verified', label: 'Live post verified by oracle', percent: 40 },
  { key: 'attribution_closed', label: 'Performance attribution closed', percent: 30 },
];

const milestoneSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    percent: Number,
    amount: Number,
    released: { type: Boolean, default: false },
    releasedAt: Date,
    txHash: String,
  },
  { _id: false }
);

const escrowSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignRequest', required: true },
    proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'MatchProposal', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    totalAmount: { type: Number, required: true },
    releasedAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },

    platformFeePercent: { type: Number, default: 18 },

    contractAddress: { type: String, default: '' }, // simulated Polygon L2 contract
    network: { type: String, default: 'Polygon L2' },

    milestones: { type: [milestoneSchema], default: [] },

    status: {
      type: String,
      enum: ['funded', 'partially_released', 'settled', 'disputed', 'refunded'],
      default: 'funded',
    },
    disputeNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('EscrowLedger', escrowSchema);
