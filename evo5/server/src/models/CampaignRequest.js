import mongoose from 'mongoose';

export const PARTICIPANT_TYPES = ['influencer', 'celebrity', 'volunteer', 'surveyor'];

const campaignSchema = new mongoose.Schema(
  {
    // Anonymous public reference, e.g. "Request #Goa-2847"
    reference: { type: String, unique: true, index: true },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true },
    brief: { type: String, required: true },

    participantType: { type: String, enum: PARTICIPANT_TYPES, required: true },
    category: { type: String, default: 'General' },
    region: { type: String, default: 'Global' },

    budget: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    minFollowers: { type: Number, default: 0 },
    deliverables: { type: String, default: '' },
    urgency: { type: String, enum: ['low', 'standard', 'high'], default: 'standard' },

    // Set by the AI Mediation Oracle at ingestion time
    aiTags: { type: [String], default: [] },
    fairRateLow: { type: Number, default: 0 },
    fairRateHigh: { type: Number, default: 0 },
    predictedReach: { type: Number, default: 0 },
    predictedEngagements: { type: Number, default: 0 },
    predictedConversions: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['ingested', 'matching', 'matched', 'in_progress', 'completed', 'cancelled'],
      default: 'ingested',
    },
  },
  { timestamps: true }
);

export default mongoose.model('CampaignRequest', campaignSchema);
