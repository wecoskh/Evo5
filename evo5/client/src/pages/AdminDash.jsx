import { useEffect, useState } from 'react';
import { api, fmtMoney, fmtNum } from '../lib/api.js';

export default function AdminDash({ tab }) {
  if (tab === 'campaigns') return <AdminCampaigns />;
  if (tab === 'escrow') return <AdminEscrow />;
  return <AdminOverview />;
}

function AdminOverview() {
  const [s, setS] = useState(null);
  const [pub, setPub] = useState(null);

  useEffect(() => {
    api('/stats/admin').then(setS).catch(() => {});
    api('/stats/public', { auth: false }).then(setPub).catch(() => {});
  }, []);

  if (!s) return <div className="loading">Loading command center…</div>;

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Command Center</h1>
          <p>AI matchmaking, escrow management and fraud monitoring — master controller view.</p>
        </div>
        <span className="badge badge-violet">Admin</span>
      </div>

      <div className="kpi-grid">
        <Kpi label="Escrow held" value={fmtMoney(s.escrow.held)} sub="Locked in smart contracts" />
        <Kpi label="Released" value={fmtMoney(s.escrow.released)} sub="Across milestones" />
        <Kpi label="Platform revenue" value={fmtMoney(s.escrow.revenue)} sub="18% commission" />
        <Kpi label="Pending proposals" value={s.proposals.pending} sub={`${s.proposals.matched} matched`} />
        <Kpi label="Quarantined" value={s.quarantined} sub="Below 75 authenticity" />
      </div>

      {pub && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>5-in-1 participant pools</h3>
              <p>Average authenticity across creators & celebrities: {pub.avgAuthenticity}/100</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="kpi-grid" style={{ marginBottom: 0 }}>
              <Kpi label="Influencers" value={pub.participants.influencers} sub="Digital creators" />
              <Kpi label="Celebrities" value={pub.participants.celebrities} sub="High-value talent" />
              <Kpi label="Volunteers" value={pub.participants.volunteers} sub="Cause advocates" />
              <Kpi label="Surveyors" value={pub.participants.surveyors} sub="Field researchers" />
              <Kpi label="Customers" value={pub.customers} sub="Brands & NGOs" />
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head"><h3>Campaign pipeline</h3></div>
        <div className="panel-body">
          {Object.entries(s.campaigns.byStatus).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <div className="flex between" style={{ fontSize: 13.5, marginBottom: 6 }}>
                <span style={{ textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
                <span className="dim">{v} of {s.campaigns.total}</span>
              </div>
              <div className="progress"><span style={{ width: `${(v / s.campaigns.total) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [cands, setCands] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api('/campaigns').then((d) => setCampaigns(d.campaigns)).catch(() => {});
  useEffect(() => { load(); }, []);

  async function open(id) {
    setSel(id); setCands(null); setMsg('');
    const d = await api(`/campaigns/${id}`);
    setDetail(d);
    const c = await api(`/campaigns/${id}/candidates`);
    setCands(c);
  }

  async function dispatch(participantId, offerAmount) {
    setMsg('');
    try {
      await api('/proposals', { method: 'POST', body: { campaignId: sel, participantId, offerAmount } });
      setMsg('Blind proposal dispatched — identity remains masked on both sides.');
      await open(sel);
      load();
    } catch (e) { setMsg(e.message); }
  }

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Campaign Mediation</h1>
          <p>Review anonymised requests and dispatch blind proposals to ranked candidates.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>All requests</h3></div>
        <div className="panel-body tight" style={{ overflowX: 'auto' }}>
          <table className="dtable">
            <thead>
              <tr><th>Reference</th><th>Title</th><th>Type</th><th>Region</th><th>Budget</th><th>FairRate</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id}>
                  <td className="mono" style={{ color: 'var(--cyan)' }}>#{c.reference}</td>
                  <td>{c.title}</td>
                  <td><span className="badge badge-grey">{c.participantType}</span></td>
                  <td className="muted">{c.region}</td>
                  <td>{fmtMoney(c.budget, c.currency)}</td>
                  <td className="muted mono">{fmtMoney(c.fairRateLow)}–{fmtMoney(c.fairRateHigh)}</td>
                  <td><StatusBadge s={c.status} /></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => open(c._id)}>Mediate</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <>
          {msg && <div className={`alert ${msg.includes('dispatched') ? 'alert-ok' : 'alert-err'}`}>{msg}</div>}

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>#{detail.campaign.reference} — {detail.campaign.title}</h3>
                <p>{detail.campaign.category} · {detail.campaign.region} · urgency {detail.campaign.urgency}</p>
              </div>
              <span className="badge badge-blue">{fmtMoney(detail.campaign.budget)}</span>
            </div>
            <div className="panel-body">
              <p className="muted" style={{ marginTop: 0 }}>{detail.campaign.brief}</p>
              <div>
                {detail.campaign.aiTags.map((t) => <span className="chip" key={t}>{t}</span>)}
              </div>
              <div className="result-grid">
                <div className="result-box"><div className="rv">{fmtNum(detail.campaign.predictedReach)}</div><div className="rl">Predicted reach</div></div>
                <div className="result-box"><div className="rv">{fmtNum(detail.campaign.predictedEngagements)}</div><div className="rl">Engagements</div></div>
                <div className="result-box"><div className="rv" style={{ color: 'var(--green)' }}>{fmtNum(detail.campaign.predictedConversions)}</div><div className="rl">Conversions</div></div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Existing proposals</h3>
                <p>Both sides see aliases only until mutual acceptance.</p>
              </div>
            </div>
            <div className="panel-body tight" style={{ overflowX: 'auto' }}>
              {detail.proposals.length === 0 ? (
                <p className="loading">No proposals dispatched yet.</p>
              ) : (
                <table className="dtable">
                  <thead><tr><th>Alias</th><th>Real identity</th><th>Fit</th><th>Offer</th><th>Customer</th><th>Participant</th><th>Status</th></tr></thead>
                  <tbody>
                    {detail.proposals.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.participantAlias}</strong></td>
                        <td className="muted">{p.participantIdentity?.name || '—'}</td>
                        <td><FitBar v={p.fitScore} /></td>
                        <td>{fmtMoney(p.offerAmount)}</td>
                        <td>{p.customerAccepted ? '✅' : '⏳'}</td>
                        <td>{p.participantAccepted ? '✅' : '⏳'}</td>
                        <td><StatusBadge s={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>AI-ranked candidates</h3>
                <p>Anonymous pool filtered by predictive fit and authenticity.</p>
              </div>
            </div>
            <div className="panel-body tight" style={{ overflowX: 'auto' }}>
              {!cands ? <p className="loading">Running predictive match…</p> : cands.candidates.length === 0 ? (
                <p className="loading">No further candidates available.</p>
              ) : (
                <table className="dtable">
                  <thead><tr><th>Codename</th><th>Niche</th><th>Region</th><th>Reach</th><th>Auth</th><th>Fit</th><th>Suggested</th><th></th></tr></thead>
                  <tbody>
                    {cands.candidates.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.codename}</strong></td>
                        <td className="muted">{c.niche}</td>
                        <td className="muted">{c.region}</td>
                        <td className="mono">{c.followersBand}</td>
                        <td><AuthPill v={c.authenticityScore} /></td>
                        <td><FitBar v={c.fitScore} /></td>
                        <td>{fmtMoney(c.suggestedOffer)}</td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => dispatch(c.id, c.suggestedOffer)}>
                            Dispatch blind
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function AdminEscrow() {
  const [ledgers, setLedgers] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () => api('/escrow').then((d) => setLedgers(d.ledgers)).catch(() => {});
  useEffect(() => { load(); }, []);

  const [err, setErr] = useState('');

  async function release(id, key) {
    setMsg(''); setErr('');
    try {
      await api(`/escrow/${id}/release`, { method: 'POST', body: { milestoneKey: key } });
      setMsg('Milestone released on-chain.');
      load();
    } catch (e) { setErr(e.message); }
  }

  async function dispute(id, slashStake) {
    setMsg(''); setErr('');
    try {
      const r = await api(`/escrow/${id}/dispute`, {
        method: 'POST',
        body: { note: slashStake ? 'Fraud / ghosting confirmed by admin' : 'Dispute opened for review', slashStake },
      });
      setMsg(r.slashed
        ? `Stake slashed: ${r.slashed} tokens burned. Authenticity dropped to ${r.participant.authenticityScore}${r.participant.quarantined ? ' — participant quarantined.' : '.'}`
        : 'Dispute opened — contract frozen pending review.');
      load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Escrow Ledger</h1>
          <p>Gas-optimised milestone releases on Polygon L2.</p>
        </div>
      </div>

      {msg && <div className="alert alert-ok">{msg}</div>}
      {err && <div className="alert alert-err">{err}</div>}

      {ledgers.length === 0 && <div className="panel"><p className="loading">No escrow contracts funded yet.</p></div>}

      {ledgers.map((l) => (
        <div className="panel" key={l._id}>
          <div className="panel-head">
            <div>
              <h3>#{l.campaign?.reference} — {l.campaign?.title}</h3>
              <p className="mono">{l.contractAddress} · {l.network}</p>
            </div>
            <div className="flex gap-8 aic wrap">
              <span className="badge badge-blue">{fmtMoney(l.totalAmount, l.currency)}</span>
              <StatusBadge s={l.status} />
            </div>
          </div>
          <div className="panel-body">
            <div className="progress" style={{ marginBottom: 16 }}>
              <span style={{ width: `${(l.releasedAmount / l.totalAmount) * 100}%` }} />
            </div>
            {l.milestones.map((m) => (
              <div className="milestone" key={m.key}>
                <span className={`ms-dot ${m.released ? 'done' : ''}`} />
                <div className="ms-body">
                  <h5>{m.label} · {m.percent}%</h5>
                  <p>{m.txHash ? m.txHash : 'Awaiting trigger'}</p>
                </div>
                <strong style={{ fontSize: 14 }}>{fmtMoney(m.amount, l.currency)}</strong>
                {!m.released && l.status !== 'disputed' && (
                  <button className="btn btn-success btn-sm" onClick={() => release(l._id, m.key)}>Release</button>
                )}
              </div>
            ))}

            {l.status !== 'settled' && (
              <div className="flex between aic wrap gap-8" style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <p className="dim" style={{ margin: 0, fontSize: 13, flex: 1, minWidth: 220 }}>
                  {l.status === 'disputed'
                    ? `⚠️ ${l.disputeNote || 'Dispute open'} — releases frozen.`
                    : 'Reputation staking: confirmed fraud or ghosting slashes the participant’s stake.'}
                </p>
                <div className="flex gap-8 wrap">
                  <button className="btn btn-ghost btn-sm" onClick={() => dispute(l._id, false)}>Open dispute</button>
                  <button className="btn btn-danger btn-sm" onClick={() => dispute(l._id, true)}>Slash stake</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------- shared bits ---------- */
export function Kpi({ label, value, sub }) {
  return (
    <div className="kpi">
      <div className="k-lbl">{label}</div>
      <div className="k-val">{value}</div>
      {sub && <div className="k-sub">{sub}</div>}
    </div>
  );
}

export function FitBar({ v }) {
  const color = v >= 85 ? 'var(--green)' : v >= 70 ? 'var(--cyan)' : 'var(--amber)';
  return (
    <div style={{ minWidth: 90 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{v}%</div>
      <div className="progress" style={{ height: 5 }}>
        <span style={{ width: `${v}%`, background: color }} />
      </div>
    </div>
  );
}

export function AuthPill({ v }) {
  const cls = v >= 85 ? 'badge-green' : v >= 75 ? 'badge-amber' : 'badge-rose';
  return <span className={`badge ${cls}`}>{v}</span>;
}

export function StatusBadge({ s }) {
  const map = {
    ingested: 'badge-grey', matching: 'badge-blue', matched: 'badge-green', MATCHED: 'badge-green',
    in_progress: 'badge-violet', completed: 'badge-green', cancelled: 'badge-rose',
    PENDING: 'badge-amber', REJECTED: 'badge-rose', funded: 'badge-blue',
    partially_released: 'badge-violet', settled: 'badge-green', disputed: 'badge-rose',
  };
  return <span className={`badge ${map[s] || 'badge-grey'}`}>{String(s).replace('_', ' ')}</span>;
}
