import { Card, Button, Badge } from '../components/ui';
import { SectionHeader } from '../components/layout';
import type { Booking, Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
  bookings: Booking[];
  setSelectedBookingId: (id: string) => void;
};

export default function BookingsPage({ setPage, bookings, setSelectedBookingId }: Props) {
  return (
    <Card>
      <SectionHeader title="My Bookings" />
      {bookings.length === 0 ? (
        <div className="empty-state">
          <h3>No Bookings Yet</h3>
          <p className="muted">Start by searching for a service specialist near you.</p>
          <Button onClick={() => setPage('home')}>Explore Services</Button>
        </div>
      ) : (
        <div className="stack gap-12">
          {bookings.map(b => (
            <div key={b.id} className="job-row">
              <div>
                <strong>{b.service}</strong>
                <p className="muted small-text">Specialist: {b.specialist}</p>
                <p className="muted small-text">{b.date} at {b.time}</p>
              </div>
              <div className="button-row end-row">
                <Badge tone="soft">{b.status}</Badge>
                <Button variant="secondary" onClick={() => { setSelectedBookingId(b.id); setPage('tracking'); }}>
                  Track
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}