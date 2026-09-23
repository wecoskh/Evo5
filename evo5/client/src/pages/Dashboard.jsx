import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import AdminDash from './AdminDash.jsx';
import CustomerDash from './CustomerDash.jsx';
import ParticipantDash from './ParticipantDash.jsx';

const NAV = {
  admin: [
    ['overview', '📊 Overview'],
    ['campaigns', '🎯 Mediation'],
    ['escrow', '🔗 Escrow ledger'],
  ],
  customer: [
    ['overview', '🎯 My campaigns'],
    ['new', '✨ New request'],
    ['escrow', '🔗 Escrow'],
  ],
  participant: [
    ['overview', '📬 Blind inbox'],
    ['escrow', '💰 Earnings'],
    ['profile', '🛡️ Verification'],
  ],
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('overview');

  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const group = user.role === 'admin' ? 'admin' : user.role === 'customer' ? 'customer' : 'participant';
  const links = NAV[group];

  return (
    <div className="dash">
      <aside className="side">
        <div className="side-title">{user.role}</div>
        {links.map(([key, label]) => (
          <a
            key={key}
            className={`side-link ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
            href="#"
            onClickCapture={(e) => e.preventDefault()}
          >
            {label}
          </a>
        ))}
        <div className="side-title" style={{ marginTop: 22 }}>Signed in</div>
        <div style={{ padding: '0 12px', fontSize: 13 }}>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
          <div className="dim" style={{ fontSize: 12 }}>{user.company || user.codename || user.email}</div>
        </div>
      </aside>

      <main className="dash-main">
        {group === 'admin' && <AdminDash tab={tab} />}
        {group === 'customer' && <CustomerDash tab={tab} />}
        {group === 'participant' && <ParticipantDash tab={tab} />}
      </main>
    </div>
  );
}
