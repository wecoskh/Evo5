# EvO5 — AI-Mediated Zero-Contact 5-in-1 Marketplace

Fullstack **MERN** implementation of the EvO5 blueprint: *"Where Influence Meets Intelligence — Zero Friction, Full Trust."*

A marketing site **plus** a working platform — the Zero-Contact blind matching protocol, AI mediation oracle, Proof-of-Reach anti-fraud engine and milestone escrow are all functional, not mockups.

---

## Running it

Two processes. Both are already running in this workspace.

```bash
# Terminal 1 — API (Express + Mongoose)
cd server && npm install && npm run dev     # http://localhost:4000

# Terminal 2 — Client (React + Vite)
cd client && npm install && npm run dev     # http://localhost:5173
```

The browser only ever calls `/api/*` relatively; Vite proxies to Express.

### Database
By default the server boots an **in-memory MongoDB** (`mongodb-memory-server`) and auto-seeds demo data, so it runs anywhere with zero setup. To use a real MongoDB:

```bash
MONGO_URI="mongodb://localhost:27017/evo5" npm run dev
```

> Note: with the in-memory DB, data resets on restart.

---

## Demo accounts — password `evo5demo`

| Email | Role | What you see |
|---|---|---|
| `admin@evo5.io` | Admin | Command center, AI candidate ranking, escrow releases |
| `hotel@evo5.io` | Customer | Villa Serena Goa — campaigns, blind proposals |
| `brand@evo5.io` | Customer | Nuvo Skincare (DTC beauty) |
| `ngo@evo5.io` | Customer | CleanSeas Foundation |
| `creator1@evo5.io` … `creator10@evo5.io` | Influencer | Blind inbox, earnings, verification profile |
| `celeb1@evo5.io` … `celeb3@evo5.io` | Celebrity | High-value talent view |
| `volunteer1@evo5.io` … `3` | Volunteer | Cause advocacy |
| `surveyor1@evo5.io` … `3` | Surveyor | Field research |

---

## Walking the Zero-Contact protocol

1. Sign in as **hotel@evo5.io** → *New request* → submit a brief. The AI categorises it, computes a FairRate band, forecasts reach, and masks your brand behind a reference like `#Goa-2847`.
2. Sign in as **admin@evo5.io** → *Mediation* → open that campaign. Candidates appear as `Creator A`, `Creator B` with fit % and authenticity scores — **never real names**. Dispatch a blind proposal.
3. Sign in as the matched **creator** → *Blind inbox*. They see `Travel Brand`, the payout and the brief with emails/handles/links scrubbed. Accept.
4. Back as the **customer** → accept too. On mutual acceptance identities unlock, the smart contract funds, and the 30/40/30 milestone ladder appears.
5. As **admin** → *Escrow ledger* → release milestones and watch tx hashes and platform revenue update.

---

## Architecture

```
client/                     React 18 + Vite + React Router
  src/sections/Landing.jsx  Full marketing site from the blueprint
  src/sections/Demos.jsx    Live AI oracle + Proof-of-Reach widgets
  src/pages/                Auth, Admin / Customer / Participant dashboards
  src/lib/api.js            Relative fetch wrapper + JWT storage

server/                     Express 4 + Mongoose 8
  src/lib/aiOracle.js       Categoriser, FairRate, fit scoring, simulator, fraud scorer
  src/lib/auth.js           JWT + role guards
  src/models/               User · CampaignRequest · MatchProposal · EscrowLedger
  src/routes/               auth · campaigns · proposals · escrow · stats
  src/seedData.js           23 users, 4 campaigns, funded escrow
```

### The four models (as specified in the blueprint)
- **User** — credentials, six roles, masked `codename`, authenticity score, tier, staked tokens
- **CampaignRequest** — anonymous `reference`, AI tags, FairRate band, predictions, status
- **MatchProposal** — blind aliases, fit score, dual-acceptance flags, `identitiesUnlocked`
- **EscrowLedger** — contract address, 30/40/30 milestones, release state, disputes

---

## How the AI layer works

All four Oracle subsystems from the blueprint are implemented: auto-categorisation, predictive matching, dynamic pricing and sentiment analysis.

`server/src/lib/aiOracle.js` is a **deterministic simulation** — no external LLM key required, so it runs offline and gives repeatable results:

- **Categorisation** — keyword scoring across 9 verticals + urgency detection
- **Sentiment / brand safety** — scans a creator's content archive for hate speech, controversy, misinformation and substance markers. Scores below 55 are blocked from proposals entirely, before any brand sees them.
- **Fit score (0–100)** — niche 30 · region 15 · reach 20 · authenticity 20 · engagement 10 · track record 5
- **FairRate** — budget × regional seasonality × category demand × reach factor
- **Authenticity (0–100)** — flags engagement ratios that are *too high* (pods), young accounts, generic-comment ratio, geographic incoherence. **Below 75 → auto-quarantined** from matching queues.

Swap this one file for real API calls (OpenAI, Instagram Graph, TikTok) to go live — every route already depends on its interface, not its implementation.

---

## Verified behaviour

End-to-end tested: blind dispatch never leaks real names (only follower *bands*), briefs are scrubbed of emails/handles/URLs, one-sided acceptance does **not** unlock identities, outsiders get 403 on others' campaigns, and customers cannot reach the admin candidate pool.

Trust-layer tested: brand-unsafe talent is filtered from candidate lists *and* rejected at dispatch; slashing a stake burns 50% of tokens and drops the authenticity score (auto-quarantining if it falls below 75); a disputed contract freezes all further milestone releases server-side, not just in the UI.

---

## Not implemented (deliberately)

Real OAuth handshakes, an actual deployed Solidity contract, and live payment rails are stubbed — the escrow "transactions" are simulated hashes. Everything else is functional application logic.
