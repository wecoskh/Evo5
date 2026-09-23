import { useEffect, useState } from 'react';
import { api, fmtMoney, fmtNum } from '../lib/api.js';
import { Kpi, FitBar, StatusBadge, AuthPill } from './AdminDash.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function ParticipantDash({ tab }) {
  if (tab === 'escrow') return <ParticipantEscrow />;
  if (tab === 'profile') return <Profile />;
  return <BlindInbox />;
}

function BlindInbox() {
  const [proposals, setProposals] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => api('/proposals/inbox')
    .then((d) => { setProposals(d.proposals); setLoading(false); })
    .catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function act(id, action) {
    setMsg('');
    try {
      const r = await api(`/proposals/${id}/${action}`, { method: 'POST' });
      setMsg(r.escrow
        ? '🎉 Mutual acceptance — the brand is revealed and escrow is funded.'
        : action === 'accept' ? 'Accepted. Waiting on the brand to confirm.' : 'Proposal declined.');
      load();
    } catch (e) { setMsg(e.message); }
  }

  if (loading) return <div className="loading">Loading blind inbox…</div>;

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Blind Inbox</h1>
          <p>Brand identities are withheld until you accept — no poaching, no rate degradation.</p>
        </div>
      </div>

      {msg && <div className={`alert ${msg.startsWith('🎉') ? 'alert-ok' : 'alert-info'}`}>{msg}</div>}

      {proposals.length === 0 && (
        <div className="panel"><p className="loading">No blind proposals yet. The AI will route matching campaigns to you.</p></div>
      )}

      <div className="grid grid-2">
        {proposals.map((p) => (
          <div className={p.identitiesUnlocked ? 'card' : 'blind-card'} key={p.id}>
            <div className="flex between aic wrap gap-8" style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: 16 }}>{p.customerAlias}</strong>
              <StatusBadge s={p.status} />
            </div>
            <div className="mono" style={{ fontSize: 12.5, color: 'var(--cyan)', marginBottom: 10 }}>
              #{p.reference}
            </div>

            {!p.identitiesUnlocked && (
              <p className="dim" style={{ fontSize: 12.5, marginTop: 0 }}>
                🔒 Brand identity and links withheld until mutual acceptance
              </p>
            )}

            <p className="muted" style={{ fontSize: 14 }}>{p.brief}</p>

            <div style={{ margin: '10px 0' }}>
              <span className="chip">{p.category}</span>
              <span className="chip">{p.region}</span>
              {p.deliverables && <span className="chip">{p.deliverables}</span>}
            </div>

            <div className="flex between aic" style={{ margin: '14px 0' }}>
              <div>
                <div className="dim" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.06em' }}>Estimated payout</div>
                <strong style={{ fontSize: 20 }}>{fmtMoney(p.offerAmount)}</strong>
              </div>
              <FitBar v={p.fitScore} />
            </div>

            {p.status === 'PENDING' && (
              <div className="flex gap-8">
                <button className="btn btn-success btn-sm" disabled={p.participantAccepted} onClick={() => act(p.id, 'accept')}>
                  {p.participantAccepted ? 'You accepted ✓' : 'Accept blind offer'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => act(p.id, 'reject')}>Decline</button>
              </div>
            )}
            {p.identitiesUnlocked && (
              <div className="alert alert-ok" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
                Identity unlocked · contract signed · escrow funded
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function ParticipantEscrow() {
  const [ledgers, setLedgers] = useState([]);
  useEffect(() => { api('/escrow').then((d) => setLedgers(d.ledgers)).catch(() => {}); }, []);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>My Earnings</h1>
          <p>Milestone payouts release automatically as the oracle verifies each stage.</p>
        </div>
      </div>
      {ledgers.length === 0 && <div className="panel"><p className="loading">No active contracts.</p></div>}
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
              <Kpi label="Contract value" value={fmtMoney(l.totalAmount, l.currency)} />
              <Kpi label="Paid out" value={fmtMoney(l.releasedAmount, l.currency)} />
              <Kpi label="Pending" value={fmtMoney(l.totalAmount - l.releasedAmount, l.currency)} />
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

function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Verification Profile</h1>
          <p>Your Proof-of-Reach score and reputation stake.</p>
        </div>
        <span className="badge badge-violet">{user.tier} tier</span>
      </div>

      <div className="kpi-grid">
        <Kpi label="Codename" value={user.codename || '—'} sub="Shown to brands pre-match" />
        <Kpi label="Authenticity" value={user.authenticityScore} sub={user.quarantined ? 'Quarantined' : 'Cleared'} />
        <Kpi label="Followers" value={fmtNum(user.followers)} sub={`${user.engagementRate}% engagement`} />
        <Kpi label="Staked tokens" value={fmtNum(user.stakedTokens)} sub="Slashed on fraud" />
        <Kpi label="Completed" value={user.completedCampaigns} sub="Campaigns delivered" />
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Reputation economy</h3></div>
        <div className="panel-body">
          <div className="flex between" style={{ fontSize: 13.5, marginBottom: 8 }}>
            <span>Progress to next tier</span>
            <span className="dim">{user.completedCampaigns} campaigns</span>
          </div>
          <div className="progress" style={{ marginBottom: 18 }}>
            <span style={{ width: `${Math.min(100, (user.completedCampaigns / 40) * 100)}%` }} />
          </div>
          <div className="flex gap-8 wrap">
            {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((t) => (
              <span key={t} className={`badge ${t === user.tier ? 'badge-violet' : 'badge-grey'}`}>{t}</span>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 16, marginBottom: 0 }}>
            Higher tiers unlock faster payouts and greater visibility in the AI matching queue.
            Accounts scoring below 75 are automatically quarantined from automated matching.
          </p>
        </div>
      </div>
    </>
  );
}
