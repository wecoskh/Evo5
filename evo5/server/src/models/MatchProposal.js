import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignRequest', required: true },
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Blind labels shown to each side before the reveal
    participantAlias: { type: String, required: true }, // "Creator A"
    customerAlias: { type: String, required: true }, // "Travel Brand"

    fitScore: { type: Number, default: 0 }, // AI predictive match %
    offerAmount: { type: Number, required: true },

    customerAccepted: { type: Boolean, default: false },
    participantAccepted: { type: Boolean, default: false },

    // Identities stay masked until BOTH sides accept
    identitiesUnlocked: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['PENDING', 'MATCHED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true }
);

proposalSchema.index({ campaign: 1, participant: 1 }, { unique: true });

export default mongoose.model('MatchProposal', proposalSchema);
