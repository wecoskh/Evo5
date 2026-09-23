import { Router } from 'express';
import User, { ROLES } from '../models/User.js';
import { signToken, authenticate } from '../lib/auth.js';
import { authenticityScore } from '../lib/aiOracle.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'customer', ...rest } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const user = new User({ name, email, role, ...rest });
    await user.setPassword(password);

    // Participants get a masked codename + an initial Proof-of-Reach score
    if (role !== 'customer' && role !== 'admin') {
      const count = await User.countDocuments({ role });
      const label = { influencer: 'Creator', celebrity: 'Celebrity', volunteer: 'Volunteer', surveyor: 'Surveyor' }[role];
      user.codename = `${label} ${String.fromCharCode(65 + (count % 26))}${Math.floor(Math.random() * 90 + 10)}`;
      user.authenticityScore = authenticityScore({
        followers: user.followers,
        engagementRate: user.engagementRate,
        accountAgeMonths: 18,
      });
      user.quarantined = user.authenticityScore < 75;
    }

    await user.save();
    res.status(201).json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await user.verifyPassword(password || ''))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

export default router;
