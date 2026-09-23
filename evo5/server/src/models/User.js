import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['admin', 'customer', 'influencer', 'celebrity', 'volunteer', 'surveyor'];
export const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true, default: 'customer' },

    // Masked handle used everywhere in the Zero-Contact protocol ("Creator A", "Celebrity X")
    codename: { type: String, index: true },

    // Participant profile
    niche: { type: String, default: 'General' },
    region: { type: String, default: 'Global' },
    languages: { type: [String], default: ['English'] },
    platforms: { type: [String], default: [] },
    followers: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    baseRate: { type: Number, default: 0 },

    // Trust layer
    authenticityScore: { type: Number, default: 0, min: 0, max: 100 },
    // Sentiment / brand-safety scan of historical content (blueprint §4A)
    contentArchive: { type: [String], default: [] },
    brandSafetyScore: { type: Number, default: 100, min: 0, max: 100 },
    brandSafetyFlags: { type: [String], default: [] },
    tier: { type: String, enum: TIERS, default: 'Bronze' },
    stakedTokens: { type: Number, default: 0 },
    completedCampaigns: { type: Number, default: 0 },
    quarantined: { type: Boolean, default: false },

    // Customer profile
    company: { type: String, default: '' },
    industry: { type: String, default: '' },

    status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Anything the requester is allowed to see BEFORE a match unlocks identities.
userSchema.methods.toBlind = function () {
  return {
    id: this._id,
    codename: this.codename,
    role: this.role,
    niche: this.niche,
    region: this.region,
    languages: this.languages,
    platforms: this.platforms,
    followersBand: bandFollowers(this.followers),
    engagementRate: this.engagementRate,
    tier: this.tier,
    completedCampaigns: this.completedCampaigns,
    brandSafetyScore: this.brandSafetyScore,
  };
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    codename: this.codename,
    niche: this.niche,
    region: this.region,
    platforms: this.platforms,
    followers: this.followers,
    engagementRate: this.engagementRate,
    baseRate: this.baseRate,
    authenticityScore: this.authenticityScore,
    brandSafetyScore: this.brandSafetyScore,
    brandSafetyFlags: this.brandSafetyFlags,
    tier: this.tier,
    stakedTokens: this.stakedTokens,
    completedCampaigns: this.completedCampaigns,
    quarantined: this.quarantined,
    company: this.company,
    industry: this.industry,
    status: this.status,
  };
};

export function bandFollowers(n) {
  if (n >= 1_000_000) return '1M+';
  if (n >= 500_000) return '500K–1M';
  if (n >= 100_000) return '100K–500K';
  if (n >= 50_000) return '50K–100K';
  if (n >= 10_000) return '10K–50K';
  return '<10K';
}

export default mongoose.model('User', userSchema);
