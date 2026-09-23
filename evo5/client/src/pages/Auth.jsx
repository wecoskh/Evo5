import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

const DEMO = [
  ['admin@evo5.io', 'Admin — command center'],
  ['hotel@evo5.io', 'Customer — Villa Serena Goa'],
  ['creator1@evo5.io', 'Influencer — blind inbox'],
  ['celeb1@evo5.io', 'Celebrity — high-value talent'],
];

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@evo5.io');
  const [password, setPassword] = useState('evo5demo');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await login(email, password);
      nav('/app');
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="demo-panel auth-card fade-up">
        <h2 style={{ margin: '0 0 6px', fontSize: 24, letterSpacing: '-0.02em' }}>Sign in to EvO5</h2>
        <p className="muted" style={{ margin: '0 0 22px', fontSize: 14.5 }}>
          Access the mediation layer, blind inbox and escrow ledger.
        </p>

        {err && <div className="alert alert-err">{err}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-accounts">
          <h5>Demo accounts · password evo5demo</h5>
          {DEMO.map(([mail, label]) => (
            <button key={mail} className="demo-btn" onClick={() => { setEmail(mail); setPassword('evo5demo'); }}>
              <span>{label}</span>
              <span>{mail}</span>
            </button>
          ))}
        </div>

        <p className="center muted" style={{ fontSize: 14, marginTop: 18, marginBottom: 0 }}>
          No account? <Link to="/register" style={{ color: 'var(--cyan)' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'customer',
    company: '', niche: 'Travel', region: 'Goa', followers: 50000, engagementRate: 4, baseRate: 20000,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isParticipant = ['influencer', 'celebrity', 'volunteer', 'surveyor'].includes(form.role);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const payload = { ...form, followers: Number(form.followers), engagementRate: Number(form.engagementRate), baseRate: Number(form.baseRate) };
      await register(payload);
      nav('/app');
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="demo-panel auth-card fade-up">
        <h2 style={{ margin: '0 0 6px', fontSize: 24, letterSpacing: '-0.02em' }}>Join EvO5</h2>
        <p className="muted" style={{ margin: '0 0 22px', fontSize: 14.5 }}>
          Participants are assigned a masked codename and scored by the Proof-of-Reach engine.
        </p>

        {err && <div className="alert alert-err">{err}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>I am a…</label>
            <select className="select" value={form.role} onChange={set('role')}>
              <option value="customer">Customer — brand, business or NGO</option>
              <option value="influencer">Influencer — digital creator</option>
              <option value="celebrity">Celebrity — high-value talent</option>
              <option value="volunteer">Volunteer — social cause advocate</option>
              <option value="surveyor">Surveyor — field researcher</option>
            </select>
          </div>

          <div className="row">
            <div className="field">
              <label>Full name</label>
              <input className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required />
            </div>
          </div>

          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={6} />
          </div>

          {form.role === 'customer' ? (
            <div className="field">
              <label>Company / organisation</label>
              <input className="input" value={form.company} onChange={set('company')} placeholder="Villa Serena Goa" />
            </div>
          ) : (
            <>
              <div className="row">
                <div className="field">
                  <label>Niche</label>
                  <select className="select" value={form.niche} onChange={set('niche')}>
                    {['Travel', 'Food', 'Fashion', 'Beauty', 'Tech', 'Fitness', 'Social', 'Research', 'Retail'].map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Region</label>
                  <select className="select" value={form.region} onChange={set('region')}>
                    {['Goa', 'Mumbai', 'Delhi', 'Bengaluru', 'Kerala', 'Chennai', 'Dubai', 'Global'].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Followers</label>
                  <input className="input" type="number" value={form.followers} onChange={set('followers')} />
                </div>
                <div className="field">
                  <label>Engagement rate (%)</label>
                  <input className="input" type="number" step="0.1" value={form.engagementRate} onChange={set('engagementRate')} />
                </div>
              </div>
              <div className="field">
                <label>Base rate per campaign (₹)</label>
                <input className="input" type="number" value={form.baseRate} onChange={set('baseRate')} />
              </div>
            </>
          )}

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="center muted" style={{ fontSize: 14, marginTop: 18, marginBottom: 0 }}>
          Already registered? <Link to="/login" style={{ color: 'var(--cyan)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
