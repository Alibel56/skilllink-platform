import { Mail, Phone, MapPin } from 'lucide-react';
import { Card, Button, Avatar } from '../components/ui';
import { SectionHeader } from '../components/layout';
import type { Page, Booking, ServiceOffer } from '../types';

type Props = {
  setPage: (p: Page) => void;
  user: any;
  selectedAvatar: string;
  setShowAvatarPicker: (v: boolean) => void;
  setIsEditingProfile: (v: boolean) => void;
  setShowLogoutConfirm: (v: boolean) => void;
  setEditName: (v: string) => void;
  setEditEmail: (v: string) => void;
  setEditPhone: (v: string) => void;
  setEditCountry: (v: string) => void;
  setEditCity: (v: string) => void;
  setEditOldPassword: (v: string) => void;
  setEditNewPassword: (v: string) => void;
  setEditConfirmPassword: (v: string) => void;
  setEditErrors: (v: Record<string, string>) => void;
  setEditSuccess: (v: string) => void;
  specialistOffers: ServiceOffer[];
  specialistBookings: Booking[];
  completedBookings: Booking[];
  totalEarnings: number;
};

export default function UserProfilePage({
  setPage, user, selectedAvatar,
  setShowAvatarPicker, setIsEditingProfile, setShowLogoutConfirm,
  setEditName, setEditEmail, setEditPhone,
  setEditCountry, setEditCity,
  setEditOldPassword, setEditNewPassword, setEditConfirmPassword,
  setEditErrors, setEditSuccess,
  specialistOffers, specialistBookings, completedBookings, totalEarnings,
}: Props) {
  const openEdit = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditCountry(user.country);
    setEditCity(user.city);
    setEditOldPassword('');
    setEditNewPassword('');
    setEditConfirmPassword('');
    setEditErrors({});
    setEditSuccess('');
    setIsEditingProfile(true);
  };

  return (
    <div className="profile-grid alt-grid">
      <Card>
        <div className="profile-box-center">
          <Avatar name={user.name || 'User'} image={selectedAvatar} onClick={() => setShowAvatarPicker(true)} />
          <p className="muted small-text" style={{ marginTop: '6px' }}>Tap avatar to change</p>
          <h2 className="mt-12">{user.name || 'User'}</h2>
          <p className="muted">{user.role === 'client' ? 'Client Account' : 'Specialist Account'}</p>

          <div className="stack gap-12 mt-16 full-width">
            <div className="contact-item">
              <Mail size={18} className="blue-icon" />
              <span>{user.email || 'No email'}</span>
            </div>
            <div className="contact-item">
              <Phone size={18} className="blue-icon" />
              <span>{user.phone || 'No phone'}</span>
            </div>
            <div className="contact-item">
              <MapPin size={18} className="blue-icon" />
              <span>{user.country && user.city ? `${user.country}, ${user.city}` : 'No location'}</span>
            </div>
          </div>

          <Button className="full-width" style={{ marginTop: '16px' }} onClick={openEdit}>
            ✏️ Edit Profile
          </Button>
        </div>
      </Card>

      <Card>
        {user.role === 'specialist' && (
          <>
            <SectionHeader title="Account Overview" />
            <div className="cards-grid two-cols mt-16">
              <div className="soft-box"><p className="muted small-text">My Offers</p><h2>{specialistOffers.length}</h2></div>
              <div className="soft-box"><p className="muted small-text">Total Orders</p><h2>{specialistBookings.length}</h2></div>
              <div className="soft-box"><p className="muted small-text">Completed</p><h2>{completedBookings.length}</h2></div>
              <div className="soft-box"><p className="muted small-text">Earnings</p><h2>${totalEarnings}</h2></div>
            </div>
          </>
        )}

        <div className="soft-box mt-16">
          <strong>Quick Actions</strong>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
            {user.role === 'specialist' ? (
              <>
                <Button onClick={() => setPage('dashboard')}>Open Dashboard</Button>
                <Button variant="secondary" onClick={() => setPage('myOffers')}>My Offers</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setPage('home')}>Browse Services</Button>
                <Button variant="secondary" onClick={() => setPage('bookings')}>View Bookings</Button>
              </>
            )}
          </div>
          <button
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', marginTop: '12px', width: '100%', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
            onClick={() => setShowLogoutConfirm(true)}>
            Log Out
          </button>
        </div>
      </Card>
    </div>
  );
}