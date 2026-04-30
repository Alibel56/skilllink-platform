import { useState, useEffect } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button, Avatar } from './components/ui';
import { BottomNav } from './components/layout';
import { pageTitles, avatarOptions, initialReviews, specialistsSeed } from './data';
import { getBookings, saveBookings, getOrderChats, saveOrderChats } from './storage';

import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ListingPage from './pages/ListingPage';
import ProfilePage from './pages/ProfilePage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import TrackingPage from './pages/TrackingPage';
import FeedbackPage from './pages/FeedbackPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import MyOffersPage from './pages/MyOffersPage';
import CreateOfferPage from './pages/CreateOfferPage';
import BookingsPage from './pages/BookingsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserProfilePage from './pages/UserProfilePage';
import ContactPage from './pages/ContactPage';
import Modals from './modals';

import type { Page, Role, Booking, ServiceOffer, OrderChats } from './types';

export default function App() {
  const [user, setUser] = useState({ name: '', email: '', phone: '', country: '', city: '', role: 'client' as Role });
  const [page, setPage] = useState<Page>('welcome');
  const [role, setRole] = useState<Role>('client');

  // auth
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // offers
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerCategory, setOfferCategory] = useState('plumbing');
  const [offerTags, setOfferTags] = useState<string[]>([]);
  const [offerTagInput, setOfferTagInput] = useState('');

  // booking
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('00:00');
  const [serviceDetails, setServiceDetails] = useState('I need help with a power outlet and living room lights.');
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<number>(1);
  const [selectedOffer, setSelectedOffer] = useState<ServiceOffer | null>(null);

  // search & filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  // reviews
  const [reviews, setReviews] = useState(initialReviews);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('Very professional and quick service.');

  // notifications
  const [notifications, setNotifications] = useState([{ id: 1, text: 'Welcome to SkillLink!' }]);
  const [unreadCount, setUnreadCount] = useState(1);

  // chat
  const [orderChats, setOrderChats] = useState<OrderChats>({});
  const [chatMessage, setChatMessage] = useState('');

  // profile
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSuccess, setEditSuccess] = useState('');
  const [showEditOldPass, setShowEditOldPass] = useState(false);
  const [showEditNewPass, setShowEditNewPass] = useState(false);
  const [showEditConfirmPass, setShowEditConfirmPass] = useState(false);

  // effects
  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setRole(parsed.role);
      setPage(parsed.role === 'client' ? 'home' : 'dashboard');
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('offers');
    if (saved) {
      const parsed = JSON.parse(saved);
      setOffers(parsed.map((o: any) => ({ ...o, tags: Array.isArray(o.tags) ? o.tags : [] })));
    }
  }, []);

  useEffect(() => { setBookings(getBookings()); }, []);
  useEffect(() => { setOrderChats(getOrderChats()); }, []);
  useEffect(() => { localStorage.setItem('offers', JSON.stringify(offers)); }, [offers]);
  useEffect(() => { saveBookings(bookings); }, [bookings]);
  useEffect(() => { saveOrderChats(orderChats); }, [orderChats]);
  useEffect(() => { if (page === 'notifications') setUnreadCount(0); }, [page]);

  useEffect(() => {
    if (!bookingDate) return;
    const min = getMinTime();
    if (bookingTime < min) setBookingTime(min);
  }, [bookingDate]);

  const getMinTime = () => {
    const today = new Date().toISOString().split('T')[0];
    if (bookingDate === today) return new Date().toTimeString().slice(0, 5);
    return '00:00';
  };

  const goHomeForRole = () => setPage(role === 'client' ? 'home' : 'dashboard');

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser({ name: '', email: '', phone: '', country: '', city: '', role: 'client' });
    setPassword('');
    setPage('login');
  };

  const handleLogin = () => {
    setLoginError(false);
    setLoginErrorMsg('');
    if (!loginEmail || !loginPassword) { setLoginErrorMsg('Please fill in all fields'); setLoginError(true); return; }
    if (!loginEmail.includes('@')) { setLoginErrorMsg('Email must contain @'); setLoginError(true); return; }
    if (loginPassword.length < 6) { setLoginErrorMsg('Password must be at least 6 characters'); setLoginError(true); return; }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find((u: any) => u.email === loginEmail && u.password === loginPassword);
    if (!found) { setLoginErrorMsg('Incorrect email or password'); setLoginError(true); return; }

    setUser(found);
    setRole(found.role);
    localStorage.setItem('currentUser', JSON.stringify(found));
    setPage(found.role === 'specialist' ? 'dashboard' : 'home');
  };

  const handleBookingConfirm = () => {
    const specialist = selectedOffer
      ? { name: selectedOffer.specialistName, price: selectedOffer.price, title: selectedOffer.title }
      : specialistsSeed.find((s: any) => s.id === selectedSpecialistId) ?? specialistsSeed[0];

    const newBooking: Booking = {
      id: `SKL-${Date.now()}`,
      client: user.name,
      specialist: specialist.name,
      service: selectedOffer ? selectedOffer.title : specialist.title,
      date: bookingDate,
      time: bookingTime,
      total: specialist.price + 3,
      status: 'Pending',
      details: serviceDetails,
    };
    setBookings(prev => [newBooking, ...prev]);
    setOrderChats(prev => ({ ...prev, [newBooking.id]: prev[newBooking.id] ?? [] }));
    setSelectedBookingId(newBooking.id);
    setPage('confirmation');
    setNotifications(prev => [{ id: prev.length + 1, text: `Booking confirmed!` }, ...prev]);
    setUnreadCount(prev => prev + 1);
    setSelectedOffer(null);
  };

  const cancelBooking = (id: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== id) return b;
      if (['Completed', 'In Progress', 'Cancelled'].includes(b.status)) return b;
      return { ...b, status: 'Cancelled' };
    }));
  };

  const updateBookingStatus = (id: string) => {
    const statuses = ['Pending', 'Accepted', 'In Progress', 'Completed'];
    setBookings(prev => prev.map(b => {
      if (b.id !== id) return b;
      if (['Cancelled', 'Completed'].includes(b.status)) return b;
      const next = statuses[Math.min(statuses.indexOf(b.status) + 1, statuses.length - 1)];
      return { ...b, status: next };
    }));
  };

  const submitReview = () => {
    setReviews(prev => [{ id: prev.length + 1, name: 'You', rating: reviewRating, text: reviewComment }, ...prev]);
    setReviewComment('');
    setReviewRating(5);
    setPage('home');
  };

  const sendOrderMessage = () => {
    if (!selectedBookingId || !chatMessage.trim()) return;
    const booking = bookings.find(b => b.id === selectedBookingId);
    if (!booking) return;
    if (booking.client !== user.name && booking.specialist !== user.name) return;
    setOrderChats(prev => ({
      ...prev,
      [selectedBookingId]: [...(prev[selectedBookingId] ?? []), {
        id: `MSG-${Date.now()}`,
        senderEmail: user.email,
        senderName: user.name,
        text: chatMessage.trim(),
        createdAt: new Date().toISOString(),
      }],
    }));
    setChatMessage('');
  };

  const selectedBooking = bookings.find(b => b.id === selectedBookingId) ?? bookings[0] ?? null;
  const selectedSpecialist = specialistsSeed.find((s: any) => s.id === selectedSpecialistId) ?? specialistsSeed[0];
  const specialistOffers = offers.filter(o => o.specialistName === user.name);
  const specialistBookings = bookings.filter(b => b.specialist === user.name);
  const completedBookings = specialistBookings.filter(b => b.status === 'Completed');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.total, 0);
  const currentChatMessages = selectedBookingId ? orderChats[selectedBookingId] ?? [] : [];
  const chatPartnerName = selectedBooking ? (user.role === 'specialist' ? selectedBooking.client : selectedBooking.specialist) : 'User';
  const canOpenOrderChat = Boolean(selectedBooking && (selectedBooking.client === user.name || selectedBooking.specialist === user.name));

  const topBar = !['welcome', 'login', 'signup'].includes(page) && (
    <div className="topbar">
      <div className="container topbar-inner">
        <div className="topbar-left">
          {!['home', 'dashboard', 'bookings', 'notifications', 'jobs', 'userProfile'].includes(page) && (
            <Button variant="secondary" className="icon-btn" onClick={goHomeForRole}>
              <ArrowLeft size={18} />
            </Button>
          )}
          <div>
            <h1>{pageTitles[page]}</h1>
            <p>SkillLink service marketplace</p>
          </div>
        </div>
        <div className="topbar-right">
          <button className="notif-btn" onClick={() => { setPage('notifications'); setUnreadCount(0); }}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
          </button>
          <div onClick={() => setPage('userProfile')} style={{ cursor: 'pointer' }}>
            <Avatar name={user.name || 'User'} image={selectedAvatar} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      {topBar}
      <main className="container page-content">
        {page === 'welcome' && <WelcomePage setPage={setPage} />}
        {page === 'login' && <LoginPage setPage={setPage} loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} loginError={loginError} loginErrorMsg={loginErrorMsg} handleLogin={handleLogin} setShowForgotPassword={setShowForgotPassword} />}
        {page === 'signup' && <SignupPage setPage={setPage} user={user} setUser={setUser} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} showPassword={showPassword} setShowPassword={setShowPassword} showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword} role={role} setRole={setRole} signupErrors={signupErrors} setSignupErrors={setSignupErrors} goHomeForRole={goHomeForRole} />}
        {page === 'home' && <HomePage setPage={setPage} user={user} search={search} setSearch={setSearch} offers={offers} setSelectedCategory={setSelectedCategory} setSelectedSpecialistId={setSelectedSpecialistId} setSelectedOffer={setSelectedOffer} />}
        {page === 'listing' && <ListingPage setPage={setPage} search={search} setSearch={setSearch} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} sortBy={sortBy} setSortBy={setSortBy} setSelectedSpecialistId={setSelectedSpecialistId} />}
        {page === 'profile' && <ProfilePage setPage={setPage} selectedSpecialistId={selectedSpecialistId} reviews={reviews} />}
        {page === 'booking' && <BookingPage setPage={setPage} selectedSpecialistId={selectedSpecialistId} selectedOffer={selectedOffer} bookingDate={bookingDate} setBookingDate={setBookingDate} bookingTime={bookingTime} setBookingTime={setBookingTime} serviceDetails={serviceDetails} setServiceDetails={setServiceDetails} getMinTime={getMinTime} handleBookingConfirm={handleBookingConfirm} />}
        {page === 'confirmation' && <ConfirmationPage setPage={setPage} selectedBooking={selectedBooking} />}
        {page === 'tracking' && <TrackingPage setPage={setPage} selectedBooking={selectedBooking} cancelBooking={cancelBooking} />}
        {page === 'feedback' && <FeedbackPage setPage={setPage} selectedSpecialistId={selectedSpecialistId} reviewRating={reviewRating} setReviewRating={setReviewRating} reviewComment={reviewComment} setReviewComment={setReviewComment} submitReview={submitReview} />}
        {page === 'dashboard' && <DashboardPage setPage={setPage} specialistOffers={specialistOffers} specialistBookings={specialistBookings} completedBookings={completedBookings} totalEarnings={totalEarnings} userName={user.name} setSelectedBookingId={setSelectedBookingId} />}
        {page === 'jobs' && <JobsPage setPage={setPage} specialistBookings={specialistBookings} updateBookingStatus={updateBookingStatus} />}
        {page === 'myOffers' && <MyOffersPage setPage={setPage} offers={offers} userName={user.name} />}
        {page === 'createOffer' && <CreateOfferPage setPage={setPage} offerTitle={offerTitle} setOfferTitle={setOfferTitle} offerDescription={offerDescription} setOfferDescription={setOfferDescription} offerPrice={offerPrice} setOfferPrice={setOfferPrice} offerCategory={offerCategory} setOfferCategory={setOfferCategory} offerTags={offerTags} setOfferTags={setOfferTags} offerTagInput={offerTagInput} setOfferTagInput={setOfferTagInput} userName={user.name} setOffers={setOffers} />}
        {page === 'bookings' && <BookingsPage setPage={setPage} bookings={bookings} setSelectedBookingId={setSelectedBookingId} />}
        {page === 'notifications' && <NotificationsPage notifications={notifications} />}
        {page === 'userProfile' && <UserProfilePage setPage={setPage} user={user} selectedAvatar={selectedAvatar} setShowAvatarPicker={setShowAvatarPicker} setIsEditingProfile={setIsEditingProfile} setShowLogoutConfirm={setShowLogoutConfirm} setEditName={setEditName} setEditEmail={setEditEmail} setEditPhone={setEditPhone} setEditCountry={setEditCountry} setEditCity={setEditCity} setEditOldPassword={setEditOldPassword} setEditNewPassword={setEditNewPassword} setEditConfirmPassword={setEditConfirmPassword} setEditErrors={setEditErrors} setEditSuccess={setEditSuccess} specialistOffers={specialistOffers} specialistBookings={specialistBookings} completedBookings={completedBookings} totalEarnings={totalEarnings} />}
        {page === 'contact' && <ContactPage setPage={setPage} selectedBooking={selectedBooking} canOpenOrderChat={canOpenOrderChat} currentChatMessages={currentChatMessages} chatPartnerName={chatPartnerName} chatMessage={chatMessage} setChatMessage={setChatMessage} sendOrderMessage={sendOrderMessage} userEmail={user.email} userRole={user.role} />}
      </main>

      {!['welcome', 'login', 'signup'].includes(page) && (
        <BottomNav role={role}
          active={page === 'userProfile' ? 'profile' : ['tracking', 'confirmation', 'feedback', 'listing', 'profile', 'booking'].includes(page) ? (role === 'client' ? 'home' : 'dashboard') : page}
          onNavigate={target => { if (target === 'profile') { setPage('userProfile'); return; } setPage(target as Page); }} />
      )}

      <Modals
        showAvatarPicker={showAvatarPicker} setShowAvatarPicker={setShowAvatarPicker}
        selectedAvatar={selectedAvatar} setSelectedAvatar={setSelectedAvatar}
        showLogoutConfirm={showLogoutConfirm} setShowLogoutConfirm={setShowLogoutConfirm}
        handleLogout={handleLogout}
        showForgotPassword={showForgotPassword} setShowForgotPassword={setShowForgotPassword}
        forgotEmail={forgotEmail} setForgotEmail={setForgotEmail}
        forgotSent={forgotSent} setForgotSent={setForgotSent}
        isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile}
        editName={editName} setEditName={setEditName}
        editEmail={editEmail} setEditEmail={setEditEmail}
        editPhone={editPhone} setEditPhone={setEditPhone}
        editCountry={editCountry} setEditCountry={setEditCountry}
        editCity={editCity} setEditCity={setEditCity}
        editOldPassword={editOldPassword} setEditOldPassword={setEditOldPassword}
        editNewPassword={editNewPassword} setEditNewPassword={setEditNewPassword}
        editConfirmPassword={editConfirmPassword} setEditConfirmPassword={setEditConfirmPassword}
        editErrors={editErrors} setEditErrors={setEditErrors}
        editSuccess={editSuccess} setEditSuccess={setEditSuccess}
        showEditOldPass={showEditOldPass} setShowEditOldPass={setShowEditOldPass}
        showEditNewPass={showEditNewPass} setShowEditNewPass={setShowEditNewPass}
        showEditConfirmPass={showEditConfirmPass} setShowEditConfirmPass={setShowEditConfirmPass}
        user={user} setUser={setUser}
      />
    </div>
  );
}
