import { CheckCircle2 } from 'lucide-react';
import { Card, Button } from '../components/ui';
import type { Booking, Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
  selectedBooking: Booking | null;
};

export default function ConfirmationPage({ setPage, selectedBooking }: Props) {
  return (
    <div className="centered-page wide">
      <Card className="success-card">
        <div className="success-icon"><CheckCircle2 size={40} /></div>
        <h2>Booking Confirmed!</h2>
        <p className="muted">Your service request has been successfully placed.</p>

        {selectedBooking && (
          <div className="soft-box mt-16 left-text">
            <p><strong>Order ID:</strong> {selectedBooking.id}</p>
            <p><strong>Specialist:</strong> {selectedBooking.specialist}</p>
            <p><strong>Date & Time:</strong> {selectedBooking.date} at {selectedBooking.time}</p>
            <p><strong>Total Price:</strong> ${selectedBooking.total}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center' }}>
          <Button onClick={() => setPage('tracking')}>Track Order</Button>
          <Button variant="secondary" onClick={() => setPage('home')}>Back to Home</Button>
        </div>
      </Card>
    </div>
  );
}