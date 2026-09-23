import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtMoney, fmtNum } from '../lib/api.js';
import { AiDemo, AuthenticityDemo, BrandSafetyDemo } from './Demos.jsx';

const PROBLEMS = [
  ['Fake Followers', '35% of influencers inflate metrics with bought followers and comment pods.', 'AI-powered Authenticity Score + direct API verification.'],
  ['Direct Poaching', 'Brands bypass platforms to cut out the middleman, killing monetisation.', 'Zero-contact policy — identities stay masked until deals close.'],
  ['Price Chaos', 'No standard pricing anywhere; endless negotiation fatigue.', 'AI FairRate Engine for real-time market benchmarking.'],
  ['Payment Fraud', 'Creators ghost after payment; brands refuse to pay after delivery.', 'Smart contract escrow with milestone-based releases.'],
  ['Siloed Resources', 'Separate tools needed for creators, talent, volunteers and researchers.', '5-in-1 unified ecosystem for marketing and research.'],
];

const PILLARS = [
  { n: '01', t: 'Influencers', d: 'Digital creators', items: ['Instagram, TikTok, YouTube', 'Programmatic OAuth audits', 'Real-time engagement monitoring'] },
  { n: '02', t: 'Celebrities', d: 'High-value talent', items: ['Film, sports and TV figures', 'Silver → Diamond tier matrices', 'Manager sign-off workflows'] },
  { n: '03', t: 'Volunteers', d: 'Social cause advocates', items: ['NGO & CSR deployment', 'Impact tracking + badges', 'Stipend and reputation rewards'] },
  { n: '04', t: 'Surveyors', d: 'Field researchers', items: ['Physical data collection', 'Mystery shopping & polling', 'Location-verified submissions'] },
  { n: '05', t: 'Customers', d: 'Brands & businesses', items: ['Hotels, DTC brands, NGOs', 'Structured request budgets', 'Fraud-free promotion & research'] },
];

const FLOW = [
  ['Request Ingestion', 'A boutique hotel submits a campaign request with budget and reach criteria.', '"Promote luxury villa amenities, budget ₹50,000, travel creators with 50K+ real reach."'],
  ['Identity Masking', 'The system scrubs all branding and converts the brief into an anonymous data object.', 'Request #Goa-2847'],
  ['AI Evaluation & Filtering', 'The mediation engine cross-references verified databases and isolates matching talent.', 'Creator A · 94% fit  |  Creator B · 88% fit'],
  ['Blind Proposal Dispatch', 'Selected creators get an isolated notification. Brand name and links are withheld.', '"Travel brand, 3-post requirement, estimated payout ₹45,000."'],
  ['Commitment & Escrow', 'Once both sides accept, identities unlock, contracts sign and the budget locks in escrow.', 'Smart contract funded · Polygon L2'],
];

const FEATURES = [
  { icon: '🤖', title: 'AI Mediation Oracle', desc: 'EV05-GPT auto-categorises requests, runs predictive matchmaking on past campaigns, and suggests dynamic pricing.' },
  { icon: '🔗', title: 'Blockchain Escrow & Staking', desc: 'Funds lock in smart contracts and release across milestones. Bad actors lose their staked platform tokens.' },
  { icon: '🛡️', title: '"Proof of Reach" Anti-Fraud', desc: 'Direct OAuth integrations filter bot networks and compute a strict 0–100 Authenticity Score.' },
  { icon: '🌍', title: 'Cultural Localization AI', desc: 'Auto-detects customer regions to prevent cultural mismatches, with multi-language negotiation templates.' },
  { icon: '📊', title: 'Social Commerce Attribution', desc: 'Generates UTM tracking links and syncs with Shopify or booking engines to calculate true ROI.' },
  { icon: '🎮', title: 'Gamified Reputation Economy', desc: 'Bronze to Diamond tiers reward reliable participants with faster payouts and higher visibility.' },
  { icon: '🏨', title: 'Vertical-Specific Toolkits', desc: 'Tailored workflows and pre-visualisation generators for hospitality, dining and retail campaigns.' },
  { icon: '⚡', title: 'Real-Time Command Center', desc: 'Admin oversight for content approval, FTC/disclosure compliance and scheduling.' },
  { icon: '🤝', title: 'Sub-Admin Agency Whitelabel', desc: 'Regional agencies operate under your platform while you retain control of the escrow layer.' },
  { icon: '🧠', title: 'Predictive Campaign Simulator', desc: 'Forecasts reach, engagement and conversions before a customer commits any capital.' },
];

const WHY_WINS = [
  { icon: '🎯', title: 'Solves a Massive Market Gap', desc: 'Addresses trust and fraud in a multi-billion dollar industry that has no credible incumbent solution.' },
  { icon: '🧩', title: 'Exclusive 5-in-1 Model', desc: 'Competitors only handle social creators. EV05 manages creators, high-end talent, volunteers and researchers simultaneously.' },
  { icon: '🔒', title: 'Defensible Zero-Contact Architecture', desc: 'Blind matching structurally eliminates platform disintermediation — brands and talent cannot route around us.' },
  { icon: '⛓️', title: 'True Trust Infrastructure', desc: 'Combines AI verification with immutable blockchain escrow, so neither side has to trust the other.' },
];

const ORACLE_SUBSYSTEMS = [
  ['Auto-Categorization', 'NLP parses unstructured customer input, instantly assigning categorical tags, urgency metrics and optimal budget tiers.'],
  ['Predictive Matching ML', 'Trained on historical campaign logs to output a percentage fit score (e.g. 94%) predicting actual ROI from niche alignment.'],
  ['Dynamic Pricing Engine', 'Calculates fair-market rates from geographic seasonality, category demand and historical engagement metrics.'],
  ['Sentiment Analysis', "Scans a creator's content archive for brand safety issues, hate speech and controversy markers before matching."],
];

const REVENUE = [
  ['Transaction Commission', '15% to 20% platform cut taken from every successfully completed escrow payout.', 'Primary Core Revenue', 'badge-green'],
  ['SaaS Subscription Tiers', 'Tiered monthly access for enterprise brands ($299/mo) and professional creators ($49/mo).', 'Predictable Recurring MRR', 'badge-blue'],
  ['Escrow Float Yield', 'Micro-yield interest accrued on capital held temporarily in escrow smart pools.', 'Passive Financial Income', 'badge-violet'],
  ['White-Label Licensing', 'B2B licensing fee ($5,000+/mo) letting regional agencies white-label the EV05 backend.', 'High-Ticket B2B Expansion', 'badge-amber'],
];

const ROADMAP = [
  ['Phase 1', 'Validation MVP', 'Deploy core zero-contact routing, user enrollment and prototype testing across select verticals such as travel hospitality hubs.'],
  ['Phase 2', 'Intelligence Integration', 'Integrate advanced AI microservices for predictive matching, dynamic pricing and automated bot-filtering via platform APIs.'],
  ['Phase 3', 'Decentralized Trust Layer', 'Transition escrow mechanics fully onto Polygon smart contracts with automated milestone oracles and reputation staking.'],
  ['Phase 4', 'International Expansion', 'Multi-currency support, regional compliance (GDPR, FTC) and white-label agency toolkits for high-growth creator markets.'],
];

const COMPARE = [
  ['Participant Scope', 'Limited to social creators only', 'Limited to database lists', 'Unified 5-in-1 platform (creators, celebrities, volunteers, surveyors)'],
  ['Contact Model', 'Direct contact enabled (high poaching risk)', 'Open email directories', '100% zero-contact blind matching'],
  ['Fraud Mitigation', 'Basic manual filters / external tools', 'None', 'Automated API verification & 0–100 Authenticity Score'],
  ['Payment Security', 'Direct invoicing (high ghosting risk)', 'Unregulated', 'Blockchain smart contract milestone escrow'],
  ['AI Integration', 'Bolt-on analytics dashboards', 'None', 'AI-native mediation oracle & dynamic pricing engine'],
];

const MILESTONES = [
  ['30%', 'Milestone 1', 'Released upon digital content draft approval.'],
  ['40%', 'Milestone 2', 'Released when the live post verification oracle confirms publication.'],
  ['30%', 'Milestone 3', 'Released after performance attribution tracking closes.'],
];

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0, className = '', style, as: Tag = 'div', ...props }) {
  const ref = useScrollReveal();
  return (
    <Tag ref={ref} className={`reveal${delay ? ` delay-${delay}` : ''} ${className}`} style={style} {...props}>
      {children}
    </Tag>
  );
}

export default function Landing() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/stats/public', { auth: false }).then(setStats).catch(() => {});
  }, []);

  return (
    <>
      <div className="ambient" aria-hidden="true" />

      {/* ---------- HERO ---------- */}
      <header className="hero">
        <div className="container">
          <Reveal delay={1}>
            <span className="eyebrow">World's first AI-mediated marketplace</span>
          </Reveal>
          <Reveal delay={2}>
            <h1>
              Where Influence Meets <span className="grad-text">Intelligence</span>
            </h1>
          </Reveal>
          <Reveal delay={3}>
            <p className="lede">
              EV05 is the world's first AI-mediated, <strong>zero-contact 5-in-1 marketplace</strong>.
              We don't provide a directory — we provide complete trust infrastructure for brands,
              creators, celebrities, volunteers and researchers through blind matching and
              smart-contract escrow.
            </p>
          </Reveal>
          <Reveal delay={4}>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">Launch a campaign →</Link>
              <a href="#try" className="btn btn-ghost btn-lg">Try the AI engine</a>
            </div>
          </Reveal>

          <Reveal delay={5}>
            <div className="stat-strip">
              <div className="stat-cell">
                <div className="stat-val grad-text">$32.55B</div>
                <div className="stat-lbl">Industry today</div>
              </div>
              <div className="stat-cell">
                <div className="stat-val grad-text">$143B</div>
                <div className="stat-lbl">By 2030</div>
              </div>
              <div className="stat-cell">
                <div className="stat-val stat-rose">35%</div>
                <div className="stat-lbl">Creators faking metrics</div>
              </div>
              <div className="stat-cell">
                <div className="stat-val">{stats ? stats.totalParticipants : '—'}</div>
                <div className="stat-lbl">Verified participants</div>
              </div>
              <div className="stat-cell">
                <div className="stat-val">{stats ? fmtMoney(stats.escrowVolume) : '—'}</div>
                <div className="stat-lbl">In escrow</div>
              </div>
            </div>
          </Reveal>
        </div>
      </header>

      {/* ---------- PRESS / TRUST ---------- */}
      <section className="section-sm press-bar">
        <div className="container">
          <div className="press-grid" aria-label="Featured in">
            <Reveal delay={1}><span className="press-label">TRUSTED BY</span></Reveal>
            <Reveal delay={2}><strong className="press-brand">LEADING BRANDS</strong></Reveal>
            <Reveal delay={3}><span className="press-accent">EV05</span></Reveal>
            <Reveal delay={4}><span className="press-accent">CREATORS</span></Reveal>
            <Reveal delay={5}><span className="press-accent">AGENCIES</span></Reveal>
          </div>
        </div>
      </section>

      {/* ---------- PROBLEM ---------- */}
      <section className="section" id="problem">
        <div className="container">
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="tag">The core problem</span>
              <h2>A multi-billion dollar industry built on <span className="grad-text">broken trust</span></h2>
              <p>
                The creator economy is scaling fast but remains fragmented, inefficient and highly
                vulnerable to fraud. Here is exactly what breaks — and how EV05 fixes it.
              </p>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="cmp-wrap">
              <table className="cmp-table problem-table">
                <thead>
                  <tr>
                    <th className="col-pain">Pain Point</th>
                    <th className="col-reality">Current Market Reality</th>
                    <th className="col-solution">EV05 Solution</th>
                  </tr>
                </thead>
                <tbody>
                  {PROBLEMS.map(([p, r, s], i) => (
                    <Reveal key={p} delay={(i % 4) + 1} as="tr">
                      <td>{p}</td>
                      <td className="bad-cell">{r}</td>
                      <td className="sol-cell">{s}</td>
                    </Reveal>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- 5-IN-1 ECOSYSTEM ---------- */}
      <section className="section" id="ecosystem">
        <div className="container">
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="tag">The 5-in-1 unified ecosystem</span>
              <h2>Five talent pools. <span className="grad-text">One command center.</span></h2>
              <p>
                Competitors handle social creators only. EV05 manages creators, high-end talent,
                volunteers and field researchers simultaneously — under one admin layer.
              </p>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="grid grid-3">
              {PILLARS.map((p, i) => (
                <div key={p.n} className="pillar">
                  <div className="pillar-num">{p.n}</div>
                  <h3>{p.t}</h3>
                  <span className="badge badge-grey">{p.d}</span>
                  <ul>{p.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={3} className="mt-lg">
            <div className="card architecture-card">
              <h3 className="architecture-title">Platform Architecture</h3>
              <pre className="ascii">┌─────────────────────────────────────────────────────────────────┐
│                        EV05 MASTER PLATFORM                     │
├─────────────────┬─────────────────────┬─────────────────────────┤
│   INFLUENCER    │      CELEBRITY      │        VOLUNTEER        │
│ • Social Media  │ • Film, Sports, TV  │ • Social Cause Advocacy │
│ • OAuth APIs    │ • Tiered Management │ • Impact Tracking       │
├─────────────────┼─────────────────────┼─────────────────────────┤
│    SURVEYOR     │      CUSTOMER       │       ADMIN (You)       │
│ • Field Research│ • Business/Brands   │ • AI Matchmaking Engine │
│ • Data Collect  │ • Request Budgets   │ • Escrow Management     │
└─────────────────┴─────────────────────┴─────────────────────────┘</pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- ZERO CONTACT PROTOCOL ---------- */}
      <section className="section section-alt" id="protocol">
        <div className="container">
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="tag">The secret weapon</span>
              <h2>Zero-Contact <span className="grad-text">Blind Matching</span> Protocol</h2>
              <p>
                For customers it eliminates harassment and price gouging. For creators it prevents
                brand poaching and rate degradation. For the platform it eliminates disintermediation.
              </p>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="flow">
              {FLOW.map(([t, d, ex], i) => (
                <div key={t} className="flow-step">
                  <div className="flow-num">{i + 1}</div>
                  <div>
                    <h4>{t}</h4>
                    <p>{d}</p>
                    <div className="flow-example">{ex}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="section" id="features">
        <div className="container">
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="tag">10 innovative features</span>
              <h2>An <span className="grad-text">AI-native</span> trust stack</h2>
              <p>Verification, mediation and settlement — engineered as one system, not bolt-ons.</p>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="grid grid-3">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="card stagger" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="card-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- WHY EV05 WINS ---------- */}
      <section className="section section-alt" id="why">
        <div className="container">
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="tag">Why EV05 wins in market</span>
              <h2>Four <span className="grad-text">defensible</span> advantages</h2>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="grid grid-4">
              {WHY_WINS.map((w, i) => (
                <div key={w.title} className="card stagger" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="card-icon">{w.icon}</div>
                  <h3>{w.title}</h3>
                  <p>{w.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={3}>
            <blockquote className="pitch">
              <p>
                "Influencer marketing is a multi-billion-dollar industry built on broken trust — 35% of
                creators fake metrics, and small businesses lose money to fraud daily. EV05 is the
                world's first AI-mediated, zero-contact 5-in-1 marketplace. We don't just provide a
                directory; we provide complete trust infrastructure for brands, creators, celebrities
                and researchers through blind matching and smart-contract escrow."
              </p>
              <cite>The EV05 thesis</cite>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ---------- LIVE AI DEMOS ---------- */}
      <section className="section" id="try">
        <div className="container">
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="tag">Live engine</span>
              <h2>Try the <span className="grad-text">AI Mediation Oracle</span></h2>
              <p>
                These run against the real backend — the same categoriser, FairRate engine and
                Proof-of-Reach scorer the platform uses in production.
              </p>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="card oracle-card">
              <div className="oracle-header">
                <div>
                  <h3 className="oracle-title">Inside the Oracle</h3>
                  <p className="oracle-desc">Four subsystems run on every request before a human sees it.</p>
                </div>
                <span className="badge badge-accent">EV05-GPT</span>
              </div>
              <div className="grid grid-4">
                {ORACLE_SUBSYSTEMS.map(([t, d], i) => (
                  <div key={t} className="stagger" style={{ animationDelay: `${i * 50}ms` }}>
                    <h4 className="oracle-sub-title">{t}</h4>
                    <p className="oracle-sub-desc">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={3}>
            <div className="grid grid-2">
              <AiDemo />
              <AuthenticityDemo />
            </div>
          </Reveal>
          <Reveal delay={4} className="mt-md">
            <BrandSafetyDemo />
          </Reveal>
        </div>
      </section>

      {/* ---------- MILESTONES ---------- */}
      <section className="section-sm section-alt" id="milestones">
        <div className="container">
          <Reveal delay={1}>
            <div className="card milestone-card">
              <div className="milestone-header">
                <div>
                  <h3 className="milestone-title">Smart contract milestone escrow</h3>
                  <p className="milestone-desc">Gas-optimised Solidity on Polygon L2 — funds never sit with either party.</p>
                </div>
                <span className="badge badge-violet">Polygon L2</span>
              </div>
              <div className="grid grid-3">
                {MILESTONES.map(([pct, m, d], i) => (
                  <div key={m} className="card milestone-item">
                    <div className="stat-val grad-text" style={{ fontSize: 36 }}>{pct}</div>
                    <h3 className="milestone-item-title">{m}</h3>
                    <p className="milestone-item-desc">{d}</p>
                  </div>
                ))}
              </div>
              <div className="staking-note">
                <strong className="staking-label">Reputation staking:</strong> participants stake platform tokens to access
                high-value tiers. Commit fraud or ghost mid-campaign and the stake is automatically
                slashed — compensating the customer and reinforcing network integrity.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- REVENUE ---------- */}
      <section className="section" id="revenue">
        <div className="container">
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="tag">Sustainable multi-stream revenue</span>
              <h2>Built for <span className="grad-text">high margins</span> and rapid scale</h2>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="card revenue-card">
              {REVENUE.map(([name, mech, target, cls], i) => (
                <div key={name} className="rev-row stagger" style={{ animationDelay: `${i * 50}ms` }}>
                  <div>
                    <h4>{name}</h4>
                    <span className={`badge ${cls}`}>{target}</span>
                  </div>
                  <p>{mech}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- ROADMAP ---------- */}
      <section className="section section-alt" id="roadmap">
        <div className="container">
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="tag">Strategic global scalability</span>
              <h2>The <span className="grad-text">roadmap</span></h2>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="card roadmap-card">
              <div className="roadmap">
                {ROADMAP.map(([phase, title, desc], i) => (
                  <div key={phase} className="phase stagger" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="phase-tag">{phase}</div>
                    <div>
                      <h4>{title}</h4>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- COMPARISON ---------- */}
      <section className="section" id="compare">
        <div className="container">
          <Reveal delay={1}>
            <div className="sec-head">
              <span className="tag">Evaluation matrix</span>
              <h2>Why EV05 <span className="grad-text">wins</span></h2>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="cmp-wrap">
              <table className="cmp-table compare-table">
                <thead>
                  <tr>
                    <th>Evaluation Vector</th>
                    <th className="col-competitor">Traditional Platforms<br /><span className="competitor-note">(Upfluence, Grin)</span></th>
                    <th>Conventional SaaS Directories</th>
                    <th className="col-ev05">EV05 Marketplace</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(([v, a, b, c], i) => (
                    <Reveal key={v} delay={(i % 4) + 1} as="tr">
                      <td>{v}</td>
                      <td className="muted">{a}</td>
                      <td className="muted">{b}</td>
                      <td className="sol-cell">{c}</td>
                    </Reveal>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="section-lg section-alt" id="cta">
        <div className="container">
          <Reveal delay={1}>
            <div className="cta-panel">
              <span className="eyebrow">Ready when you are</span>
              <h2>Complete trust infrastructure, <span className="grad-text">zero friction</span></h2>
              <p className="cta-desc">
                Sign in with a demo account to explore the full admin command center, blind proposal
                inboxes and live escrow ledger.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="btn btn-primary btn-lg">Create an account</Link>
                <Link to="/login" className="btn btn-ghost btn-lg">Use a demo login</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}