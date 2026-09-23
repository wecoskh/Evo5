import { useState } from 'react';
import { api, fmtMoney, fmtNum } from '../lib/api.js';

/** Live AI Oracle: categorisation + FairRate + campaign simulation. */
export function AiDemo() {
  const [brief, setBrief] = useState(
    'Boutique hotel in Goa promoting luxury villa amenities and infinity pool. Looking for travel creators with strong real reach for a 3-post package.'
  );
  const [budget, setBudget] = useState(50000);
  const [region, setRegion] = useState('Goa');
  const [minFollowers, setMinFollowers] = useState(50000);
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function run() {
    setBusy(true); setErr('');
    try {
      const data = await api('/stats/simulate', {
        method: 'POST', auth: false,
        body: { brief, budget: Number(budget), region, minFollowers: Number(minFollowers) },
      });
      setOut(data);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="demo-panel">
      <div className="flex between aic wrap gap-8" style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 17 }}>🤖 AI Mediation Oracle</h3>
        <span className="badge badge-blue">EV05-GPT</span>
      </div>

      <div className="field">
        <label>Campaign brief (unstructured input)</label>
        <textarea className="textarea" value={brief} onChange={(e) => setBrief(e.target.value)} />
      </div>

      <div className="row">
        <div className="field">
          <label>Budget (₹)</label>
          <input className="input" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div className="field">
          <label>Region</label>
          <select className="select" value={region} onChange={(e) => setRegion(e.target.value)}>
            {['Goa', 'Mumbai', 'Delhi', 'Bengaluru', 'Kerala', 'Dubai', 'Singapore', 'London', 'New York', 'Global'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Minimum real reach</label>
        <input className="input" type="number" step="10000" value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)} />
      </div>

      {err && <div className="alert alert-err">{err}</div>}

      <button className="btn btn-primary" onClick={run} disabled={busy} style={{ width: '100%' }}>
        {busy ? 'Analysing…' : 'Run AI analysis'}
      </button>

      {out && (
        <div className="fade-up" style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span className="dim" style={{ fontSize: 12.5 }}>Auto-detected tags · urgency: <strong>{out.ai.urgency}</strong></span>
            <div style={{ marginTop: 8 }}>
              <span className="chip" style={{ borderColor: 'rgba(34,227,212,.4)', color: '#9df0e5' }}>
                {out.ai.category}
              </span>
              {out.ai.tags.filter((t) => t !== out.ai.category).map((t) => <span className="chip" key={t}>{t}</span>)}
            </div>
          </div>

          <div className="result-grid">
            <div className="result-box">
              <div className="rv rv-band grad-text">{fmtMoney(out.rate.low)}–{fmtMoney(out.rate.high)}</div>
              <div className="rl">FairRate band</div>
            </div>
            <div className="result-box">
              <div className="rv">{fmtNum(out.simulation.reach)}</div>
              <div className="rl">Predicted reach</div>
            </div>
            <div className="result-box">
              <div className="rv">{fmtNum(out.simulation.engagements)}</div>
              <div className="rl">Engagements</div>
            </div>
            <div className="result-box">
              <div className="rv" style={{ color: 'var(--green)' }}>{fmtNum(out.simulation.conversions)}</div>
              <div className="rl">Conversions</div>
            </div>
          </div>
          <p className="dim" style={{ fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>
            Seasonality multiplier {out.rate.seasonality}× · category demand {out.rate.demand}×
          </p>
        </div>
      )}
    </div>
  );
}

/** Live Proof-of-Reach anti-fraud scorer. */
export function AuthenticityDemo() {
  const [followers, setFollowers] = useState(120000);
  const [engagementRate, setEngagementRate] = useState(4.2);
  const [accountAgeMonths, setAge] = useState(28);
  const [genericCommentRatio, setGeneric] = useState(0.1);
  const [followerGeoSpread, setGeo] = useState(0.7);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const data = await api('/stats/authenticity', {
        method: 'POST', auth: false,
        body: {
          followers: Number(followers), engagementRate: Number(engagementRate),
          accountAgeMonths: Number(accountAgeMonths),
          genericCommentRatio: Number(genericCommentRatio),
          followerGeoSpread: Number(followerGeoSpread),
        },
      });
      setRes(data);
    } catch { /* ignore */ }
    setBusy(false);
  }

  const score = res?.score ?? 0;
  const color = score >= 85 ? 'var(--green)' : score >= 75 ? 'var(--amber)' : 'var(--rose)';
  const circ = 2 * Math.PI * 54;

  return (
    <div className="demo-panel">
      <div className="flex between aic wrap gap-8" style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 17 }}>🛡️ "Proof of Reach" Scorer</h3>
        <span className="badge badge-green">Anti-fraud</span>
      </div>

      <div className="row">
        <div className="field">
          <label>Followers</label>
          <input className="input" type="number" value={followers} onChange={(e) => setFollowers(e.target.value)} />
        </div>
        <div className="field">
          <label>Engagement rate (%)</label>
          <input className="input" type="number" step="0.1" value={engagementRate} onChange={(e) => setEngagementRate(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Account age: {accountAgeMonths} months</label>
        <input type="range" min="1" max="80" value={accountAgeMonths} onChange={(e) => setAge(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div className="field">
        <label>Generic "Nice pic!" comment ratio: {Math.round(genericCommentRatio * 100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={genericCommentRatio} onChange={(e) => setGeneric(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div className="field">
        <label>Follower geography coherence: {Math.round(followerGeoSpread * 100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={followerGeoSpread} onChange={(e) => setGeo(e.target.value)} style={{ width: '100%' }} />
      </div>

      <button className="btn btn-primary" onClick={run} disabled={busy} style={{ width: '100%' }}>
        {busy ? 'Fingerprinting…' : 'Compute Authenticity Score'}
      </button>

      {res && (
        <div className="gauge-wrap fade-up" style={{ marginTop: 22 }}>
          <div className="gauge">
            <svg width="132" height="132">
              <circle cx="66" cy="66" r="54" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="11" />
              <circle
                cx="66" cy="66" r="54" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ - (circ * score) / 100}
                style={{ transition: 'stroke-dashoffset .7s ease' }}
              />
            </svg>
            <div className="gauge-label">
              <div>
                <div className="g-num" style={{ color }}>{score}</div>
                <div className="g-sub">of 100</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <span className={`badge ${res.quarantined ? 'badge-rose' : 'badge-green'}`}>
              {res.quarantined ? 'Quarantined' : 'Cleared for matching'}
            </span>
            <p className="muted" style={{ fontSize: 14, marginTop: 10, marginBottom: 0 }}>
              {res.quarantined
                ? 'Score is below 75 — this account is automatically removed from automated matching queues.'
                : 'Engagement fingerprinting found no inorganic growth patterns. Eligible for blind proposals.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Live Sentiment Analysis / brand-safety scan (blueprint §4A). */
export function BrandSafetyDemo() {
  const PRESETS = {
    clean: 'sunset villa tour\nmorning routine\nbehind the scenes\ntravel tips thread',
    risky: 'public feud with another creator\nboycott callout thread\ngambling sponsorship promo',
    severe: 'accused of hate speech\nconspiracy misinformation thread\nongoing lawsuit and scandal',
  };
  const [archive, setArchive] = useState(PRESETS.clean);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const data = await api('/stats/brand-safety', {
        method: 'POST', auth: false,
        body: { contentArchive: archive.split('\n').filter(Boolean) },
      });
      setRes(data);
    } catch { /* ignore */ }
    setBusy(false);
  }

  const tone = res?.verdict === 'safe' ? 'badge-green' : res?.verdict === 'review' ? 'badge-amber' : 'badge-rose';
  const color = res?.verdict === 'safe' ? 'var(--green)' : res?.verdict === 'review' ? 'var(--amber)' : 'var(--rose)';

  return (
    <div className="demo-panel">
      <div className="flex between aic wrap gap-8" style={{ marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 17 }}>🧭 Sentiment / Brand Safety Scan</h3>
        <span className="badge badge-violet">Pre-match gate</span>
      </div>

      <div className="flex gap-8 wrap" style={{ marginBottom: 14 }}>
        {Object.keys(PRESETS).map((k) => (
          <button key={k} className="btn btn-ghost btn-sm" onClick={() => { setArchive(PRESETS[k]); setRes(null); }}>
            {k} archive
          </button>
        ))}
      </div>

      <div className="field">
        <label>Historical content archive (one item per line)</label>
        <textarea className="textarea" value={archive} onChange={(e) => setArchive(e.target.value)} />
      </div>

      <button className="btn btn-primary" onClick={run} disabled={busy} style={{ width: '100%' }}>
        {busy ? 'Scanning archive…' : 'Run brand-safety scan'}
      </button>

      {res && (
        <div className="fade-up" style={{ marginTop: 20 }}>
          <div className="flex between aic wrap gap-14">
            <div>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', color }}>
                {res.score}<span className="dim" style={{ fontSize: 16, fontWeight: 600 }}>/100</span>
              </div>
              <span className={`badge ${tone}`}>{res.verdict}</span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 14, flex: 1, minWidth: 200 }}>
              {res.corporateSafe
                ? 'Cleared for corporate matching — no controversy markers detected.'
                : 'Flagged before matching. Scores below 55 are blocked from proposals entirely.'}
            </p>
          </div>

          {res.flags.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {res.flags.map((f) => (
                <div key={f.category} className="flex between aic" style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <strong style={{ fontSize: 14, textTransform: 'capitalize' }}>{f.category}</strong>
                    <div className="dim" style={{ fontSize: 12.5 }}>{f.matches.join(', ')}</div>
                  </div>
                  <span className={`badge ${f.severity === 'high' ? 'badge-rose' : f.severity === 'medium' ? 'badge-amber' : 'badge-grey'}`}>
                    {f.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
