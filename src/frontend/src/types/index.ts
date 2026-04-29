export type Role = 'client' | 'specialist' | 'admin';

export type Page =
  | 'welcome' | 'login' | 'signup' | 'home'
  | 'listing' | 'profile' | 'booking' | 'tracking'
  | 'confirmation' | 'feedback' | 'dashboard' | 'jobs'
  | 'bookings' | 'notifications' | 'userProfile'
  | 'contact' | 'createOffer' | 'myOffers';

export type Specialist = {
  id: number;
  name: string;
  category: string;
  title: string;
  rating: number;
  reviews: number;
  price: number;
  skills: string[];
  certifications: string[];
  verified: boolean;
  description: string;
  phone: string;
  email: string;
  portfolio: string[];
};

export type Booking = {
  id: string;
  client: string;
  specialist: string;
  service: string;
  date: string;
  time: string;
  total: number;
  status: string;
  details: string;
};

export type ChatMessage = {
  id: string;
  senderEmail: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type OrderChats = Record<string, ChatMessage[]>;

export type ServiceOffer = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  specialistName: string;
  tags: string[];
};

export type StoredUser = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  country: string;
  city: string;
};