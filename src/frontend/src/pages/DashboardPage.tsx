import { Calendar, CheckCircle2, DollarSign, Briefcase } from 'lucide-react';
import { Card, Button, Badge, IconBadge } from '../components/ui';
import { SectionHeader } from '../components/layout';
import type { Booking, Page, ServiceOffer } from '../types';

type Props = {
  setPage: (p: Page) => void;
  specialistOffers: ServiceOffer[];
  specialistBookings: Booking[];
  completedBookings: Booking[];
  totalEarnings: number;
  userName: string;
  setSelectedBookingId: (id: string) => void;
};

export default function DashboardPage({
  setPage, specialistOffers, specialistBookings,
  completedBookings, totalEarnings, userName, setSelectedBookingId,
}: Props) {
  const metrics = [
    { label: 'My Offers', value: String(specialistOffers.length), icon: Briefcase },
    { label: 'Booked Orders', value: String(specialistBookings.length), icon: Calendar },
    { label: 'Completed Orders', value: String(completedBookings.length), icon: CheckCircle2 },
    { label: 'Total Earnings', value: `$${totalEarnings}`, icon: DollarSign },
  ];

  return (
    <div className="stack gap-32">
      <div className="cards-grid four-cols">
        {metrics.map(item => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <div className="metric-card">
                <div>
                  <p className="muted small-text">{item.label}</p>
                  <h2>{item.value}</h2>
                </div>
                <IconBadge><Icon size={22} /></IconBadge>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <SectionHeader title="Incoming Orders" />
        <div className="stack gap-12">
          {specialistBookings.length === 0 ? (
            <div className="soft-box">No client orders yet.</div>
          ) : (
            specialistBookings.map(job => (
              <div key={job.id} className="job-row">
                <div>
                  <strong>{job.service}</strong>
                  <p className="muted small-text">Client: {job.client}</p>
                  <p className="muted small-text">{job.date} at {job.time}</p>
                </div>
                <div className="button-row end-row">
                  <Badge tone="soft">{job.status}</Badge>
                  <Button variant="secondary" onClick={() => { setSelectedBookingId(job.id); setPage('contact'); }}>
                    Chat
                  </Button>
                  <Button variant="secondary" onClick={() => setPage('jobs')}>
                    Open Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader title="My Offers"
          action={<Button variant="secondary" onClick={() => setPage('myOffers')}>View All</Button>} />
        <div className="stack gap-12">
          {specialistOffers.length === 0 ? (
            <div className="soft-box">You have not created any offers yet.</div>
          ) : (
            specialistOffers.slice(0, 3).map(offer => (
              <div key={offer.id} className="job-row">
                <div>
                  <strong>{offer.title}</strong>
                  <p className="muted small-text">{offer.description}</p>
                  {offer.tags.length > 0 && (
                    <div className="tag-row mt-12">
                      {offer.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
                    </div>
                  )}
                </div>
                <Badge tone="soft">${offer.price}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Notifications" />
        <div className="stack gap-12">
          {['New booking request received.', 'Upcoming job starts in 2 hours.', 'A client left you a 5-star review.'].map(note => (
            <div key={note} className="soft-box">{note}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}