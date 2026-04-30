import { Card, Button } from '../components/ui';
import { StepTracker } from '../components/layout';
import type { Booking, Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
  selectedBooking: Booking | null;
  cancelBooking: (id: string) => void;
};

export default function TrackingPage({ setPage, selectedBooking, cancelBooking }: Props) {
  return (
    <div className="booking-grid">
      <Card>
        <h2>Track Order</h2>
        {!selectedBooking ? (
          <div className="empty-state">
            <h3>No Order Selected</h3>
            <p className="muted">Please choose a booking first.</p>
            <Button onClick={() => setPage('bookings')}>Go to My Bookings</Button>
          </div>
        ) : (
          <>
            <div className="soft-box mt-16">
              <p><strong>Order ID:</strong> {selectedBooking.id}</p>
              <p><strong>Client:</strong> {selectedBooking.client}</p>
              <p><strong>Specialist:</strong> {selectedBooking.specialist}</p>
              <p><strong>Service:</strong> {selectedBooking.service}</p>
              <p><strong>Date:</strong> {selectedBooking.date}</p>
              <p><strong>Status:</strong> {selectedBooking.status}</p>
            </div>

            <div className="mt-16">
              <StepTracker status={selectedBooking.status} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
              {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Accepted') && (
                <Button onClick={() => cancelBooking(selectedBooking.id)}>Cancel Order</Button>
              )}
              <Button variant="secondary" onClick={() => setPage('contact')}>Contact Specialist</Button>
            </div>

            {selectedBooking.status === 'Completed' && (
              <div className="success-box mt-16">
                Service completed! You can now leave a review.
                <div className="mt-12">
                  <Button onClick={() => setPage('feedback')}>Leave Review</Button>
                </div>
              </div>
            )}

            {selectedBooking.status === 'Cancelled' && (
              <div className="mt-16" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '16px', padding: '16px' }}>
                This order has been cancelled.
              </div>
            )}
          </>
        )}
      </Card>

      <Card>
        <h2>Status Timeline</h2>
        <div className="stack gap-12 mt-16">
          <div className="soft-box">Pending — booking request sent to specialist.</div>
          <div className="soft-box">Accepted — specialist confirmed the request.</div>
          <div className="soft-box">In Progress — work is currently being completed.</div>
          <div className="soft-box">Completed — service is finished and ready for feedback.</div>
        </div>
      </Card>
    </div>
  );
}