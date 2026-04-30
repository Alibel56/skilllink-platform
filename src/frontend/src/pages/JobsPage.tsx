import { Card, Button, Badge } from '../components/ui';
import { SectionHeader } from '../components/layout';
import type { Booking, Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
  specialistBookings: Booking[];
  updateBookingStatus: (id: string) => void;
};

export default function JobsPage({ setPage, specialistBookings, updateBookingStatus }: Props) {
  return (
    <Card>
      <SectionHeader title="Jobs" />
      <div className="stack gap-12">
        {specialistBookings.length === 0 ? (
          <div className="empty-state">
            <h3>No Jobs Yet</h3>
            <p className="muted">Client orders will appear here automatically.</p>
            <Button variant="secondary" onClick={() => setPage('dashboard')}>Back to Dashboard</Button>
          </div>
        ) : (
          specialistBookings.map(job => (
            <div key={job.id} className="job-row">
              <div>
                <strong>{job.service}</strong>
                <p className="muted small-text">Order ID: {job.id}</p>
                <p className="muted small-text">Client: {job.client}</p>
                <p className="muted small-text">Schedule: {job.date} at {job.time}</p>
                <p className="muted small-text">Details: {job.details}</p>
                <p className="muted small-text">Total: ${job.total}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                <Badge tone="soft">{job.status}</Badge>
                {job.status === 'Pending' && (
                  <Button onClick={() => updateBookingStatus(job.id)}>Accept</Button>
                )}
                {job.status === 'Accepted' && (
                  <Button onClick={() => updateBookingStatus(job.id)}>Start Work</Button>
                )}
                {job.status === 'In Progress' && (
                  <Button onClick={() => updateBookingStatus(job.id)}>Complete</Button>
                )}
                {job.status === 'Completed' && (
                  <Button variant="secondary">Done</Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}