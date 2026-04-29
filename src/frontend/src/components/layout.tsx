import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Role } from '../types';

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function StepTracker({ status }: { status: string }) {
  if (status === 'Cancelled') {
    return (
      <div className="soft-box" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
        This order was cancelled by the client.
      </div>
    );
  }
  const steps = ['Pending', 'Accepted', 'In Progress', 'Completed'];
  const currentIndex = steps.indexOf(status);
  return (
    <div className="steps-grid">
      {steps.map((step, index) => {
        const done = index < currentIndex || status === 'Completed';
        const active = index === currentIndex;
        return (
          <div key={step} className="step-item">
            <div className={`step-circle ${done ? 'done' : active ? 'active' : ''}`}>
              {done ? <CheckCircle2 size={18} /> : index + 1}
            </div>
            <span>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BottomNav({ role, active, onNavigate }: { role: Role; active: string; onNavigate: (target: string) => void }) {
  const items = role === 'client'
    ? ['home', 'bookings', 'notifications', 'profile']
    : ['dashboard', 'jobs', 'myOffers', 'profile'];
  return (
    <div className="bottom-nav-wrap">
      <div className="bottom-nav">
        {items.map(item => (
          <button key={item} className={`bottom-nav-item ${active === item ? 'active' : ''}`} onClick={() => onNavigate(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}