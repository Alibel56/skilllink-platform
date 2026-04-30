import { Calendar, Clock } from 'lucide-react';
import { Card, Button, InputField, TextArea } from '../components/ui';
import { specialistsSeed } from '../data';
import type { Page, ServiceOffer } from '../types';

type Props = {
  setPage: (p: Page) => void;
  selectedSpecialistId: number;
  selectedOffer: ServiceOffer | null;
  bookingDate: string;
  setBookingDate: (v: string) => void;
  bookingTime: string;
  setBookingTime: (v: string) => void;
  serviceDetails: string;
  setServiceDetails: (v: string) => void;
  getMinTime: () => string;
  handleBookingConfirm: () => void;
};

export default function BookingPage({
  setPage, selectedSpecialistId, selectedOffer,
  bookingDate, setBookingDate,
  bookingTime, setBookingTime,
  serviceDetails, setServiceDetails,
  getMinTime, handleBookingConfirm,
}: Props) {
  const sp = specialistsSeed.find(s => s.id === selectedSpecialistId) ?? specialistsSeed[0];
  const price = selectedOffer ? selectedOffer.price : sp.price;
  const name = selectedOffer ? selectedOffer.specialistName : sp.name;
  const title = selectedOffer ? selectedOffer.title : sp.title;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="booking-grid">
      <Card>
        <h2>Book Service</h2>
        <div className="soft-box mt-16">
          <strong>{name}</strong>
          <p className="muted small-text">{title}</p>
        </div>

        <div className="double-grid mt-16">
          <div>
            <label className="field-label">Select Date</label>
            <div className="field-icon-wrap">
              <Calendar size={18} />
              <InputField type="date" value={bookingDate} min={today}
                onChange={(e) => setBookingDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">Select Time</label>
            <div className="field-icon-wrap">
              <Clock size={18} />
              <InputField
                type="time"
                value={bookingTime}
                min={bookingDate === today ? getMinTime() : '00:00'}
                disabled={!bookingDate}
                onChange={(e) => {
                  const t = e.target.value;
                  const min = bookingDate === today ? getMinTime() : '00:00';
                  setBookingTime(t < min ? min : t);
                }}
                style={{ opacity: bookingDate ? 1 : 0.4, cursor: bookingDate ? 'auto' : 'not-allowed' }}
              />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <label className="field-label">Describe the service you need</label>
          <TextArea value={serviceDetails} onChange={(e) => setServiceDetails(e.target.value)} />
        </div>

        <Button className="full-width mt-16" onClick={() => {
          if (!bookingDate) { alert('Please select a date'); return; }
          if (bookingDate < today) { alert('Please select a future date'); return; }
          if (bookingDate === today && bookingTime < getMinTime()) {
            alert('Please select a future time for today'); return;
          }
          handleBookingConfirm();
        }}>
          Confirm Booking
        </Button>
      </Card>

      <Card>
        <h2>Price Summary</h2>
        <div className="summary-row mt-16"><span>Service Fee</span><span>${price}</span></div>
        <div className="summary-row"><span>Platform Fee</span><span>$3</span></div>
        <div className="summary-row summary-total"><span>Total</span><span>${price + 3}</span></div>
        <div className="soft-blue-box mt-16">
          Your booking request will be sent instantly and the specialist will receive a notification.
        </div>
      </Card>
    </div>
  );
}