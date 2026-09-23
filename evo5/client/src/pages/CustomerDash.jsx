import { useEffect, useState } from 'react';
import { api, fmtMoney, fmtNum } from '../lib/api.js';
import { Kpi, FitBar, StatusBadge } from './AdminDash.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function CustomerDash({ tab }) {
  if (tab === 'new') return <NewCampaign />;
  if (tab === 'escrow') return <CustomerEscrow />;
  return <MyCampaigns />;
}

function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api('/campaigns').then((d) => setCampaigns(d.campaigns)).catch(() => {});
  useEffect(() => { load(); }, []);

  async function open(id) {
    setMsg('');
    setDetail(await api(`/campaigns/${id}`));
  }

  async function act(pid, action) {
    setMsg('');
    try {
      const r = await api(`/proposals/${pid}/${action}`, { method: 'POST' });
      setMsg(r.escrow
        ? '🎉 Mutual acceptance — identities unlocked and escrow funded on Polygon L2.'
        : action === 'accept' ? 'Accepted. Waiting on the participant to confirm.' : 'Proposal declined.');
      if (detail) open(detail.campaign._id);
      load();
    } catch (e) { setMsg(e.message); }
  }

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>My Campaigns</h1>
          <p>Candidates stay anonymous until both sides accept — that is the Zero-Contact protocol.</p>
        </div>
      </div>

      {msg && <div className={`alert ${msg.startsWith('🎉') ? 'alert-ok' : 'alert-info'}`}>{msg}</div>}

      {campaigns.length === 0 && (
        <div className="panel"><p className="loading">No campaigns yet — create your first request.</p></div>
      )}

      <div className="panel">
        <div className="panel-body tight" style={{ overflowX: 'auto' }}>
          <table className="dtable">
            <thead><tr><th>Reference</th><th>Title</th><th>Type</th><th>Budget</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id}>
                  <td className="mono" style={{ color: 'var(--cyan)' }}>#{c.reference}</td>
                  <td>{c.title}</td>
                  <td><span className="badge badge-grey">{c.participantType}</span></td>
                  <td>{fmtMoney(c.budget, c.currency)}</td>
                  <td><StatusBadge s={c.status} /></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => open(c._id)}>View proposals</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>#{detail.campaign.reference} — proposals</h3>
              <p>{detail.proposals.length} blind proposal(s) from the mediation layer</p>
            </div>
          </div>
          <div className="panel-body">
            {detail.proposals.length === 0 && <p className="loading">Admin has not dispatched proposals yet.</p>}
            <div className="grid grid-2">
              {detail.proposals.map((p) => (
                <div className={p.identitiesUnlocked ? 'card' : 'blind-card'} key={p.id}>
                  <div className="flex between aic wrap gap-8" style={{ marginBottom: 10 }}>
                    <strong style={{ fontSize: 16 }}>
                      {p.identitiesUnlocked && p.participantIdentity
                        ? p.participantIdentity.name
                        : p.participantAlias}
                    </strong>
                    <StatusBadge s={p.status} />
                  </div>

                  {!p.identitiesUnlocked && (
                    <p className="dim" style={{ fontSize: 12.5, marginTop: 0 }}>
                      🔒 Identity masked until mutual acceptance
                    </p>
                  )}

                  {p.participantSummary && (
                    <div style={{ margin: '10px 0' }}>
                      <span className="chip">{p.participantSummary.niche}</span>
                      <span className="chip">{p.participantSummary.region}</span>
                      <span className="chip">{p.participantSummary.tier} tier</span>
                      <span className="chip">{p.participantSummary.engagementRate}% ER</span>
                      <span className="chip">{p.participantSummary.completedCampaigns} campaigns</span>
                    </div>
                  )}

                  <div className="flex between aic" style={{ margin: '12px 0' }}>
                    <div>
                      <div className="dim" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Offer</div>
                      <strong style={{ fontSize: 19 }}>{fmtMoney(p.offerAmount)}</strong>
                    </div>
                    <FitBar v={p.fitScore} />
                  </div>

                  {p.status === 'PENDING' && (
                    <div className="flex gap-8">
                      <button className="btn btn-success btn-sm" disabled={p.customerAccepted} onClick={() => act(p.id, 'accept')}>
                        {p.customerAccepted ? 'You accepted ✓' : 'Accept'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => act(p.id, 'reject')}>Decline</button>
                    </div>
                  )}
                  {p.identitiesUnlocked && p.participantIdentity && (
                    <div className="alert alert-ok" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
                      Direct line unlocked · {p.participantIdentity.email} · {fmtNum(p.participantIdentity.followers)} followers
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NewCampaign() {
  const [f, setF] = useState({
    title: '', brief: '', participantType: 'influencer', region: 'Goa',
    budget: 50000, minFollowers: 50000, deliverables: '',
  });
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(''); setRes(null);
    try {
      const d = await api('/campaigns', {
        method: 'POST',
        body: { ...f, budget: Number(f.budget), minFollowers: Number(f.minFollowers) },
      });
      setRes(d.campaign);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>New Campaign Request</h1>
          <p>Your brand identity is scrubbed on ingestion and replaced with an anonymous reference.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="panel">
          <div className="panel-body">
            {err && <div className="alert alert-err">{err}</div>}
            <form onSubmit={submit}>
              <div className="field">
                <label>Campaign title</label>
                <input className="input" value={f.title} onChange={set('title')} required placeholder="Promote luxury villa amenities" />
              </div>
              <div className="field">
                <label>Brief (free text — the AI parses it)</label>
                <textarea className="textarea" value={f.brief} onChange={set('brief')} required
                  placeholder="Boutique hotel in Goa promoting villa amenities, seeking travel creators with 50K+ real reach." />
              </div>
              <div className="row">
                <div className="field">
                  <label>Participant type</label>
                  <select className="select" value={f.participantType} onChange={set('participantType')}>
                    <option value="influencer">Influencer</option>
                    <option value="celebrity">Celebrity</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="surveyor">Surveyor</option>
                  </select>
                </div>
                <div className="field">
                  <label>Region</label>
                  <select className="select" value={f.region} onChange={set('region')}>
                    {['Goa', 'Mumbai', 'Delhi', 'Bengaluru', 'Kerala', 'Chennai', 'Dubai', 'Global'].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Budget (₹)</label>
                  <input className="input" type="number" value={f.budget} onChange={set('budget')} required />
                </div>
                <div className="field">
                  <label>Minimum real reach</label>
                  <input className="input" type="number" value={f.minFollowers} onChange={set('minFollowers')} />
                </div>
              </div>
              <div className="field">
                <label>Deliverables</label>
                <input className="input" value={f.deliverables} onChange={set('deliverables')} placeholder="3 Instagram posts + 5 stories" />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Ingesting…' : 'Submit to mediation layer'}
              </button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>AI ingestion result</h3></div>
          <div className="panel-body">
            {!res ? (
              <p className="muted" style={{ marginTop: 0 }}>
                Submit a request to see the AI Mediation Oracle categorise it, compute a FairRate band
                and forecast performance — before any capital is committed.
              </p>
            ) : (
              <div className="fade-up">
                <div className="alert alert-ok">
                  Identity masked. Your request is now <strong className="mono">#{res.reference}</strong>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span className="chip" style={{ borderColor: 'rgba(34,227,212,.4)', color: '#9df0e5' }}>{res.category}</span>
                  {res.aiTags.filter((t) => t !== res.category).map((t) => <span className="chip" key={t}>{t}</span>)}
                  <span className="chip">urgency: {res.urgency}</span>
                </div>
                <div className="result-grid">
                  <div className="result-box">
                    <div className="rv rv-band grad-text">{fmtMoney(res.fairRateLow)}–{fmtMoney(res.fairRateHigh)}</div>
                    <div className="rl">FairRate band</div>
                  </div>
                  <div className="result-box"><div className="rv">{fmtNum(res.predictedReach)}</div><div className="rl">Predicted reach</div></div>
                  <div className="result-box"><div className="rv">{fmtNum(res.predictedEngagements)}</div><div className="rl">Engagements</div></div>
                  <div className="result-box"><div className="rv" style={{ color: 'var(--green)' }}>{fmtNum(res.predictedConversions)}</div><div className="rl">Conversions</div></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CustomerEscrow() {
  const [ledgers, setLedgers] = useState([]);
  useEffect(() => { api('/escrow').then((d) => setLedgers(d.ledgers)).catch(() => {}); }, []);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Escrow</h1>
          <p>Your capital is locked in smart contracts and released only against verified milestones.</p>
        </div>
      </div>
      {ledgers.length === 0 && <div className="panel"><p className="loading">No funded contracts yet.</p></div>}
      {ledgers.map((l) => (
        <div className="panel" key={l._id}>
          <div className="panel-head">
            <div>
              <h3>#{l.campaign?.reference} — {l.campaign?.title}</h3>
              <p className="mono">{l.contractAddress}</p>
            </div>
            <StatusBadge s={l.status} />
          </div>
          <div className="panel-body">
            <div className="kpi-grid">
              <Kpi label="Total" value={fmtMoney(l.totalAmount, l.currency)} />
              <Kpi label="Released" value={fmtMoney(l.releasedAmount, l.currency)} />
              <Kpi label="Still locked" value={fmtMoney(l.totalAmount - l.releasedAmount, l.currency)} />
            </div>
            {l.milestones.map((m) => (
              <div className="milestone" key={m.key}>
                <span className={`ms-dot ${m.released ? 'done' : ''}`} />
                <div className="ms-body">
                  <h5>{m.label} · {m.percent}%</h5>
                  <p>{m.txHash || 'Awaiting trigger'}</p>
                </div>
                <strong style={{ fontSize: 14 }}>{fmtMoney(m.amount, l.currency)}</strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
