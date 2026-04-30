import { Phone, Mail } from 'lucide-react';
import { Card, Button, Badge, Avatar, Stars } from '../components/ui';
import { specialistsSeed } from '../data';
import type { Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
  selectedSpecialistId: number;
  reviews: { id: number; name: string; rating: number; text: string }[];
};

export default function ProfilePage({ setPage, selectedSpecialistId, reviews }: Props) {
  const sp = specialistsSeed.find(s => s.id === selectedSpecialistId) ?? specialistsSeed[0];

  return (
    <div className="profile-grid">
      <Card>
        <div className="profile-top">
          <Avatar name={sp.name} />
          <div className="profile-main">
            <div className="name-row">
              <h2>{sp.name}</h2>
              {sp.verified && <Badge tone="soft">Verified</Badge>}
            </div>
            <p className="profile-role">{sp.title}</p>
            <div className="rating-row">
              <Stars value={sp.rating} />
              <span>{sp.rating} ({sp.reviews} reviews)</span>
            </div>
            <div className="tag-row">
              {sp.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}
            </div>
            <p className="muted mt-12">{sp.description}</p>
            <div className="contact-grid">
              <div className="contact-item"><Phone size={18} className="blue-icon" /><span>{sp.phone}</span></div>
              <div className="contact-item"><Mail size={18} className="blue-icon" /><span>{sp.email}</span></div>
            </div>
          </div>
          <Card className="price-card">
            <p className="muted">Starting from</p>
            <h2 className="price-hero">${sp.price}</h2>
            <Button className="full-width" onClick={() => setPage('booking')}>Book Service</Button>
          </Card>
        </div>
      </Card>

      <div className="side-stack">
        <Card>
          <h3>Certifications</h3>
          <div className="tag-row mt-12">
            {sp.certifications.map(c => <Badge key={c} tone="success">{c}</Badge>)}
          </div>
        </Card>
        <Card>
          <h3>Portfolio</h3>
          <div className="stack gap-12 mt-12">
            {sp.portfolio.map(item => <div key={item} className="soft-box">{item}</div>)}
          </div>
        </Card>
      </div>

      <Card className="full-span">
        <h3>Customer Reviews</h3>
        <div className="cards-grid two-cols mt-16">
          {reviews.map(r => (
            <div key={r.id} className="review-box">
              <div className="between-row">
                <strong>{r.name}</strong>
                <Stars value={r.rating} />
              </div>
              <p className="muted mt-12">{r.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}