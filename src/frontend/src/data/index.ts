import { Wrench, Zap, Sparkles, Fan, Hammer, Paintbrush } from 'lucide-react';
import type { Specialist, Page } from '../types';

export const categories = [
  { id: 'plumbing', label: 'Plumbing', icon: Wrench, description: 'Leak repairs and pipe installation in minutes' },
  { id: 'electrician', label: 'Electrician', icon: Zap, description: 'Safe wiring and lighting by certified experts' },
  { id: 'cleaning', label: 'Cleaning', icon: Sparkles, description: 'Deep home cleaning with eco-friendly products' },
  { id: 'ac', label: 'AC Repair', icon: Fan, description: 'Cooling repair and seasonal maintenance' },
  { id: 'carpentry', label: 'Carpentry', icon: Hammer, description: 'Custom woodwork and furniture assembly' },
  { id: 'painting', label: 'Painting', icon: Paintbrush, description: 'Smooth interior finishes and color design' },
];

export const specialistsSeed: Specialist[] = [
  { id: 1, name: 'Daniel Carter', category: 'electrician', title: 'Certified Electrician', rating: 4.8, reviews: 124, price: 25, skills: ['Wiring', 'Lighting', 'Circuit Repair'], certifications: ['Licensed Technician', 'Safety Certified'], verified: true, description: 'Fast and reliable home electrical repair and installation.', phone: '+1 555 102 900', email: 'daniel@skilllink.app', portfolio: ['Kitchen wiring', 'Smart light setup', 'Fuse box repair'] },
  { id: 2, name: 'Sophia Bennett', category: 'cleaning', title: 'Home Cleaning Specialist', rating: 4.9, reviews: 203, price: 18, skills: ['Deep Cleaning', 'Office Cleaning', 'Move-out Cleaning'], certifications: ['Verified Professional'], verified: true, description: 'Detailed home and office cleaning with eco-friendly products.', phone: '+1 555 220 414', email: 'sophia@skilllink.app', portfolio: ['Apartment deep clean', 'Office refresh', 'Kitchen sanitizing'] },
  { id: 3, name: 'Michael Torres', category: 'plumbing', title: 'Expert Plumber', rating: 4.7, reviews: 89, price: 22, skills: ['Leak Repair', 'Pipe Installation', 'Bathroom Fixtures'], certifications: ['Licensed Plumber'], verified: true, description: 'Affordable plumbing services for homes and small businesses.', phone: '+1 555 830 771', email: 'michael@skilllink.app', portfolio: ['Leak fix', 'Sink installation', 'Bathroom piping'] },
  { id: 4, name: 'Olivia Reed', category: 'painting', title: 'Interior Painter', rating: 4.6, reviews: 64, price: 20, skills: ['Interior Walls', 'Color Matching', 'Touch-ups'], certifications: ['Verified Professional'], verified: true, description: 'Modern paint finishes for homes, bedrooms, and workspaces.', phone: '+1 555 743 101', email: 'olivia@skilllink.app', portfolio: ['Living room refresh', 'Office repaint', 'Accent wall design'] },
  { id: 5, name: 'Ethan Walker', category: 'ac', title: 'AC Repair Technician', rating: 4.8, reviews: 111, price: 28, skills: ['AC Diagnostics', 'Cooling Repair', 'Maintenance'], certifications: ['HVAC Certified'], verified: true, description: 'Efficient AC repair and preventive maintenance for any season.', phone: '+1 555 402 988', email: 'ethan@skilllink.app', portfolio: ['AC tune-up', 'Cooling unit repair', 'Filter replacement'] },
  { id: 6, name: 'Noah Foster', category: 'carpentry', title: 'Custom Carpenter', rating: 4.7, reviews: 73, price: 27, skills: ['Cabinet Repair', 'Woodwork', 'Furniture Assembly'], certifications: ['Workshop Certified'], verified: true, description: 'Precise woodworking and furniture repair with clean finishing.', phone: '+1 555 321 665', email: 'noah@skilllink.app', portfolio: ['Shelf installation', 'Door repair', 'Custom cabinet fit'] },
];

export const initialReviews = [
  { id: 1, name: 'Emma', rating: 5, text: 'Excellent work, very professional and arrived on time.' },
  { id: 2, name: 'Liam', rating: 4, text: 'Good communication and quality service. Would hire again.' },
];

export const pageTitles: Record<Page, string> = {
  welcome: 'Welcome', login: 'Login', signup: 'Sign Up', home: 'Home',
  listing: 'Specialists', profile: 'Profile', booking: 'Booking',
  tracking: 'Order Tracking', confirmation: 'Booking Confirmation',
  feedback: 'Review', dashboard: 'Dashboard', jobs: 'Jobs',
  bookings: 'My Bookings', notifications: 'Notifications',
  userProfile: 'My Profile', contact: 'Chat',
  createOffer: 'Create Offer', myOffers: 'My Offers',
};

export const countriesWithCities: Record<string, string[]> = {
  Kazakhstan: ['Aktobe', 'Almaty', 'Astana', 'Shymkent', 'Atyrau'],
  Russia: ['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk', 'Omsk'],
  USA: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
  China: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  Uzbekistan: ['Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan'],
  Sweden: ['Stockholm', 'Gothenburg', 'Malmo', 'Uppsala', 'Vasteras'],
};

export const avatarOptions = [
  'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
  'https://cdn-icons-png.flaticon.com/512/4140/4140051.png',
  'https://cdn-icons-png.flaticon.com/512/4140/4140061.png',
  'https://cdn-icons-png.flaticon.com/512/4140/4140060.png',
  'https://cdn-icons-png.flaticon.com/512/17561/17561717.png',
];