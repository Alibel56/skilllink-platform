import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  Hammer,
  Mail,
  MapPin,
  Paintbrush,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  Zap,
  Fan,
  Briefcase,
  X,
} from 'lucide-react';

type Role = 'client' | 'specialist' | 'admin';
type Page =
  | 'welcome'
  | 'login'
  | 'signup'
  | 'home'
  | 'listing'
  | 'profile'
  | 'booking'
  | 'tracking'
  | 'confirmation'
  | 'feedback'
  | 'dashboard'
  | 'jobs'
  | 'bookings'
  | 'notifications'
  | 'userProfile'
  | 'contact'
  | 'createOffer'
  | 'myOffers';

type Specialist = {
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

type Booking = {
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

type ChatMessage = {
  id: string;
  senderEmail: string;
  senderName: string;
  text: string;
  createdAt: string;
};

type OrderChats = Record<string, ChatMessage[]>;

type ServiceOffer = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  specialistName: string;
  tags: string[];
};

const categories = [
  {
    id: 'plumbing',
    label: 'Plumbing',
    icon: Wrench,
    description: 'Leak repairs and pipe installation in minutes',
  },
  {
    id: 'electrician',
    label: 'Electrician',
    icon: Zap,
    description: 'Safe wiring and lighting by certified experts',
  },
  {
    id: 'cleaning',
    label: 'Cleaning',
    icon: Sparkles,
    description: 'Deep home cleaning with eco-friendly products',
  },
  {
    id: 'ac',
    label: 'AC Repair',
    icon: Fan,
    description: 'Cooling repair and seasonal maintenance',
  },
  {
    id: 'carpentry',
    label: 'Carpentry',
    icon: Hammer,
    description: 'Custom woodwork and furniture assembly',
  },
  {
    id: 'painting',
    label: 'Painting',
    icon: Paintbrush,
    description: 'Smooth interior finishes and color design',
  },
];

const specialistsSeed: Specialist[] = [
  {
    id: 1,
    name: 'Daniel Carter',
    category: 'electrician',
    title: 'Certified Electrician',
    rating: 4.8,
    reviews: 124,
    price: 25,
    skills: ['Wiring', 'Lighting', 'Circuit Repair'],
    certifications: ['Licensed Technician', 'Safety Certified'],
    verified: true,
    description: 'Fast and reliable home electrical repair and installation.',
    phone: '+1 555 102 900',
    email: 'daniel@skilllink.app',
    portfolio: ['Kitchen wiring', 'Smart light setup', 'Fuse box repair'],
  },
  {
    id: 2,
    name: 'Sophia Bennett',
    category: 'cleaning',
    title: 'Home Cleaning Specialist',
    rating: 4.9,
    reviews: 203,
    price: 18,
    skills: ['Deep Cleaning', 'Office Cleaning', 'Move-out Cleaning'],
    certifications: ['Verified Professional'],
    verified: true,
    description: 'Detailed home and office cleaning with eco-friendly products.',
    phone: '+1 555 220 414',
    email: 'sophia@skilllink.app',
    portfolio: ['Apartment deep clean', 'Office refresh', 'Kitchen sanitizing'],
  },
  {
    id: 3,
    name: 'Michael Torres',
    category: 'plumbing',
    title: 'Expert Plumber',
    rating: 4.7,
    reviews: 89,
    price: 22,
    skills: ['Leak Repair', 'Pipe Installation', 'Bathroom Fixtures'],
    certifications: ['Licensed Plumber'],
    verified: true,
    description: 'Affordable plumbing services for homes and small businesses.',
    phone: '+1 555 830 771',
    email: 'michael@skilllink.app',
    portfolio: ['Leak fix', 'Sink installation', 'Bathroom piping'],
  },
  {
    id: 4,
    name: 'Olivia Reed',
    category: 'painting',
    title: 'Interior Painter',
    rating: 4.6,
    reviews: 64,
    price: 20,
    skills: ['Interior Walls', 'Color Matching', 'Touch-ups'],
    certifications: ['Verified Professional'],
    verified: true,
    description: 'Modern paint finishes for homes, bedrooms, and workspaces.',
    phone: '+1 555 743 101',
    email: 'olivia@skilllink.app',
    portfolio: ['Living room refresh', 'Office repaint', 'Accent wall design'],
  },
  {
    id: 5,
    name: 'Ethan Walker',
    category: 'ac',
    title: 'AC Repair Technician',
    rating: 4.8,
    reviews: 111,
    price: 28,
    skills: ['AC Diagnostics', 'Cooling Repair', 'Maintenance'],
    certifications: ['HVAC Certified'],
    verified: true,
    description: 'Efficient AC repair and preventive maintenance for any season.',
    phone: '+1 555 402 988',
    email: 'ethan@skilllink.app',
    portfolio: ['AC tune-up', 'Cooling unit repair', 'Filter replacement'],
  },
  {
    id: 6,
    name: 'Noah Foster',
    category: 'carpentry',
    title: 'Custom Carpenter',
    rating: 4.7,
    reviews: 73,
    price: 27,
    skills: ['Cabinet Repair', 'Woodwork', 'Furniture Assembly'],
    certifications: ['Workshop Certified'],
    verified: true,
    description: 'Precise woodworking and furniture repair with clean finishing.',
    phone: '+1 555 321 665',
    email: 'noah@skilllink.app',
    portfolio: ['Shelf installation', 'Door repair', 'Custom cabinet fit'],
  },
];

const initialReviews = [
  { id: 1, name: 'Emma', rating: 5, text: 'Excellent work, very professional and arrived on time.' },
  { id: 2, name: 'Liam', rating: 4, text: 'Good communication and quality service. Would hire again.' },
];


type StoredUser = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  country: string;
  city: string;
};

const getUsers = (): StoredUser[] => {
  return JSON.parse(localStorage.getItem('users') || '[]');
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem('users', JSON.stringify(users));
};

const registerUser = (newUser: StoredUser) => {
  const users = getUsers();
  if (users.some(u => u.email === newUser.email)) {
    throw new Error('User already exists');
  }
  users.push(newUser);
  saveUsers(users);
};

const getBookings = (): Booking[] => {
  return JSON.parse(localStorage.getItem('bookings') || '[]');
};

const saveBookings = (bookings: Booking[]) => {
  localStorage.setItem('bookings', JSON.stringify(bookings));
};
const getOrderChats = (): OrderChats => {
  return JSON.parse(localStorage.getItem('orderChats') || '{}');
};

const saveOrderChats = (chats: OrderChats) => {
  localStorage.setItem('orderChats', JSON.stringify(chats));
};
const pageTitles: Record<Page, string> = {
  welcome: 'Welcome',
  login: 'Login',
  signup: 'Sign Up',
  home: 'Home',
  listing: 'Specialists',
  profile: 'Profile',
  booking: 'Booking',
  tracking: 'Order Tracking',
  confirmation: 'Booking Confirmation',
  feedback: 'Review',
  dashboard: 'Dashboard',
  jobs: 'Jobs',
  bookings: 'My Bookings',
  notifications: 'Notifications',
  userProfile: 'My Profile',
  contact: 'Chat',
  createOffer: 'Create Offer',
  myOffers: 'My Offers',
};

function IconBadge({ children }: { children: ReactNode }) {
  return <div className="icon-badge">{children}</div>;
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

function Button({
  children,
  variant = 'primary',
  onClick,
  className = '',
  type = 'button',
  style,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`.trim()}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`.trim()} />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`textarea ${props.className ?? ''}`.trim()} />;
}

function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'soft' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Avatar({
  name,
  image,
  onClick,
}: {
  name: string;
  image?: string;
  onClick?: () => void;
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return (
    <div
      className="avatar"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', overflow: 'hidden' }}
    >
      {image ? (
        <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} className={i < Math.round(value) ? 'star active' : 'star'} />
      ))}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

function StepTracker({ status }: { status: string }) {
  if (status === 'Cancelled') {
    return (
      <div className="soft-box" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
        This order was cancelled by the client.
      </div>
    );
  }

  const steps = ['Pending', 'Accepted', 'In Progress', 'Completed'];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="steps-grid">
      {steps.map((step, index) => {
        const done = index < currentIndex || status === 'Completed';
        const active = index === currentIndex;

        return (
          <div key={step} className="step-item">
            <div className={`step-circle ${done ? 'done' : active ? 'active' : ''}`}>
              {done ? <CheckCircle2 size={18} /> : index + 1}
            </div>
            <span>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

function BottomNav({ role, active, onNavigate }: { role: Role; active: string; onNavigate: (target: string) => void }) {
  const items =
    role === 'client'
      ? ['home', 'bookings', 'notifications', 'profile']
      : ['dashboard', 'jobs', 'myOffers', 'profile'];
  return (
    <div className="bottom-nav-wrap">
      <div className="bottom-nav">
        {items.map((item) => (
          <button
            key={item}
            className={`bottom-nav-item ${active === item ? 'active' : ''}`}
            onClick={() => onNavigate(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    role: 'client' as Role,
  });
  const [selectedOffer, setSelectedOffer] = useState<ServiceOffer | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [page, setPage] = useState<Page>('welcome');
  const [role, setRole] = useState<Role>('client');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [offers, setOffers] = useState<ServiceOffer[]>([]);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerCategory, setOfferCategory] = useState('plumbing');
  const [offerTags, setOfferTags] = useState<string[]>([]);
  const [offerTagInput, setOfferTagInput] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const countriesWithCities: Record<string, string[]> = {
    Kazakhstan: ['Aktobe', 'Almaty', 'Astana', 'Shymkent', 'Atyrau'],
    Russia: ['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk', 'Omsk'],
    USA: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'],
    China: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'],
    Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
    Uzbekistan: ['Tashkent', 'Samarkand', 'Bukhara', 'Andijan', 'Namangan'],
    Sweden: ['Stockholm', 'Gothenburg', 'Malmo', 'Uppsala', 'Vasteras'],
  };

  const availableCities = user.country ? countriesWithCities[user.country] : [];

  const avatarOptions = [
    'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
    'https://cdn-icons-png.flaticon.com/512/4140/4140051.png',
    'https://cdn-icons-png.flaticon.com/512/4140/4140061.png',
    'https://cdn-icons-png.flaticon.com/512/4140/4140060.png',
    'https://cdn-icons-png.flaticon.com/512/17561/17561717.png',
  ];

  const [selectedAvatar, setSelectedAvatar] = useState<string>(avatarOptions[0]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<number>(1);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('00:00');

  const getMinTime = () => {
    const today = new Date().toISOString().split('T')[0];
    if (bookingDate === today) {
      const now = new Date();
      return now.toTimeString().slice(0, 5);
    }
    return '00:00';
  };

  useEffect(() => {
    if (!bookingDate) return;
    const minTime = getMinTime();
    if (bookingTime < minTime) {
      setBookingTime(minTime);
    }
  }, [bookingDate]);

  const [serviceDetails, setServiceDetails] = useState('I need help with a power outlet and living room lights.');
  const [reviews, setReviews] = useState(initialReviews);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState([{ id: 1, text: 'Welcome to SkillLink!' }]);
  const [unreadCount, setUnreadCount] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('Very professional and quick service.');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const [orderChats, setOrderChats] = useState<OrderChats>({});
  const [chatMessage, setChatMessage] = useState('');
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

  useEffect(() => {
    if (page === 'notifications') {
      setUnreadCount(0);
    }
  }, [page]);

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
      const normalized = parsed.map((offer: any) => ({
        ...offer,
        tags: Array.isArray(offer.tags) ? offer.tags : [],
      }));
      setOffers(normalized);
    }
  }, []);

  useEffect(() => {
  const savedBookings = getBookings();
  setBookings(savedBookings);
}, []);

  useEffect(() => {
  const savedChats = getOrderChats();
  setOrderChats(savedChats);
}, []);

  useEffect(() => {
    localStorage.setItem('offers', JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
  saveBookings(bookings);
}, [bookings]);

  useEffect(() => {
  saveOrderChats(orderChats);
}, [orderChats]);
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser({ name: '', email: '', phone: '', country: '', city: '', role: 'client' });
    setPassword('');
    setPage('login');
  };

  const handleLogin = () => {
    setLoginError(false);
    setLoginErrorMsg('');

    if (!loginEmail || !loginPassword) {
      setLoginErrorMsg('Please fill in all fields');
      setLoginError(true);
      return;
    }

    if (!loginEmail.includes('@')) {
      setLoginErrorMsg('Email must contain @');
      setLoginError(true);
      return;
    }

    if (loginPassword.length < 6) {
      setLoginErrorMsg('Password must be at least 6 characters');
      setLoginError(true);
      return;
    }
    const users = getUsers();
    const found = users.find(u => u.email === loginEmail && u.password === loginPassword);

    if (!found) {
      setLoginErrorMsg('Incorrect email or password');
      setLoginError(true);
      return;
    }
    setUser(found);
    setRole(found.role);
    localStorage.setItem('currentUser', JSON.stringify(found));

    if (found.role === 'specialist') {
      setPage('dashboard');
    } else {
      setPage('home');
    }
  };

  const goHomeForRole = () => {
    if (role === 'client') {
      setPage('home');
    } else {
      setPage('dashboard');
    }
  };



  const sendOrderMessage = () => {
  if (!selectedBookingId || !chatMessage.trim()) return;
  if (!selectedBooking) return;

  const isParticipant =
    selectedBooking.client === user.name ||
    selectedBooking.specialist === user.name;

  if (!isParticipant) return;

  const text = chatMessage.trim();

  const message: ChatMessage = {
    id: `MSG-${Date.now()}`,
    senderEmail: user.email,
    senderName: user.name,
    text,
    createdAt: new Date().toISOString(),
  };

  setOrderChats((prev) => ({
    ...prev,
    [selectedBookingId]: [...(prev[selectedBookingId] ?? []), message],
  }));

  setChatMessage('');
};

  const addOfferTag = (rawValue: string) => {
  const cleaned = rawValue.trim();
  if (!cleaned) return;

  setOfferTags((prev) => {
    if (prev.some((tag) => tag.toLowerCase() === cleaned.toLowerCase())) {
      return prev;
    }

    if (prev.length >= 6) {
      return prev;
    }

    return [...prev, cleaned];
  });
};

const removeOfferTag = (tagToRemove: string) => {
  setOfferTags((prev) => prev.filter((tag) => tag !== tagToRemove));
};

const handleOfferTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    addOfferTag(offerTagInput);
    setOfferTagInput('');
  }

  if (e.key === 'Backspace' && !offerTagInput.trim() && offerTags.length > 0) {
    setOfferTags((prev) => prev.slice(0, -1));
  }
};

const handleOfferTagBlur = () => {
  if (offerTagInput.trim()) {
    addOfferTag(offerTagInput);
    setOfferTagInput('');
  }
};

  const selectedSpecialist =
  specialistsSeed.find((s) => s.id === selectedSpecialistId) ?? specialistsSeed[0];

const selectedBooking =
  bookings.find((b) => b.id === selectedBookingId) ?? bookings[0] ?? null;

const currentChatMessages =
  selectedBookingId ? orderChats[selectedBookingId] ?? [] : [];

const chatPartnerName = selectedBooking
  ? user.role === 'specialist'
    ? selectedBooking.client
    : selectedBooking.specialist
  : 'User';

const canOpenOrderChat = Boolean(
  selectedBooking &&
    (selectedBooking.client === user.name ||
      selectedBooking.specialist === user.name)
);

const specialistOffers = offers.filter((o) => o.specialistName === user.name);
const specialistBookings = bookings.filter((b) => b.specialist === user.name);
  const completedSpecialistBookings = specialistBookings.filter((b) => b.status === 'Completed');
  const specialistTotalEarnings = completedSpecialistBookings.reduce((sum, booking) => sum + booking.total, 0);

  const todayDate = new Date().toISOString().split('T')[0];
  const specialistWeekBookings = specialistBookings.filter((b) => {
    if (!b.date) return false;
    const bookingDate = new Date(b.date);
    const now = new Date();
    const diff = now.getTime() - bookingDate.getTime();
    const diffDays = diff / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  });

  const specialistMonthBookings = specialistBookings.filter((b) => {
    if (!b.date) return false;
    const bookingDate = new Date(b.date);
    const now = new Date();
    return (
      bookingDate.getMonth() === now.getMonth() &&
      bookingDate.getFullYear() === now.getFullYear()
    );
  });

  const totalStatusCount = Math.max(specialistBookings.length, 1);
    const filteredSpecialists = useMemo(() => {
      const q = search.toLowerCase();
      const result = specialistsSeed.filter((s) => {
        const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
        const matchesSearch =
          s.name.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.skills.join(' ').toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      });
      return [...result].sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return b.rating - a.rating;
      });
    }, [search, selectedCategory, sortBy]);

  const handleBookingConfirm = () => {
    const newBooking: Booking = {
      id: `SKL-${Date.now()}`,
      client: user.name,
      specialist: selectedOffer ? selectedOffer.specialistName : selectedSpecialist.name,
      service: selectedOffer ? selectedOffer.title : selectedSpecialist.title,
      date: bookingDate,
      time: bookingTime,
      total: (selectedOffer ? selectedOffer.price : selectedSpecialist.price) + 3,
      status: 'Pending',
      details: serviceDetails,
    };
    setBookings((prev) => [newBooking, ...prev]);
    setOrderChats((prev) => ({
      ...prev,
      [newBooking.id]: prev[newBooking.id] ?? [],
    }));
    setSelectedBookingId(newBooking.id);
    setPage('confirmation');
    setNotifications((prev) => [{ id: prev.length + 1, text: `Booking confirmed with ${selectedSpecialist.name}` }, ...prev]);
    setUnreadCount((prev) => prev + 1);
    setSelectedOffer(null);
  };

  const cancelBooking = (bookingId: string) => {
  setBookings((prev) =>
    prev.map((booking) => {
      if (booking.id !== bookingId) return booking;

      if (
        booking.status === 'Completed' ||
        booking.status === 'In Progress' ||
        booking.status === 'Cancelled'
      ) {
        return booking;
      }

      return {
        ...booking,
        status: 'Cancelled',
      };
    })
  );
};
const updateBookingStatus = (bookingId: string) => {
  const statuses = ['Pending', 'Accepted', 'In Progress', 'Completed'];

  setBookings((prev) =>
    prev.map((booking) => {
      if (booking.id !== bookingId) return booking;

      if (booking.status === 'Cancelled' || booking.status === 'Completed') {
        return booking;
      }

      const currentIndex = statuses.indexOf(booking.status);
      const nextStatus = statuses[Math.min(currentIndex + 1, statuses.length - 1)];

      return {
        ...booking,
        status: nextStatus,
      };
    })
  );
};

  const submitReview = () => {
    setReviews((prev) => [{ id: prev.length + 1, name: 'You', rating: reviewRating, text: reviewComment }, ...prev]);
    setReviewComment('');
    setReviewRating(5);
    setPage('home');
  };

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
          <button
            className="notif-btn"
            onClick={() => { setPage('notifications'); setUnreadCount(0); }}
          >
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

        {/* ── WELCOME ── */}
        {page === 'welcome' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-layout"
          >
            <div className="hero-left">
              <Badge tone="soft">Service Marketplace</Badge>

              <h1 className="hero-main-title">
                Find trusted specialists
                <br />
                for every job.
              </h1>

              <p className="hero-main-text">
                Book verified professionals for plumbing, electrical,
                cleaning and home repair services in just a few clicks.
              </p>

              <div className="button-row hero-buttons">
                <Button onClick={() => setPage('login')}>
                  Get Started
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setPage('signup')}
                >
                  Join Now
                </Button>
              </div>
            </div>

            <div className="hero-right">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.id}
                    className="floating-card"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconBadge><Icon size={22} /></IconBadge>
                    <div>
                      <h3>{cat.label}</h3>
                      <p>{cat.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── LOGIN ── */}
        {page === 'login' && (
          <div className="centered-page">
            <Card className="auth-card">
              <h2>Welcome Back</h2>
              <p className="muted">Log in to continue using SkillLink</p>
              <div className="stack gap-16">
                <InputField
                  placeholder="Email Address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <InputField
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <div className="between-row">
                <button className="link-btn" onClick={() => setShowForgotPassword(true)}>
                  Forgot Password?
                </button>
              </div>
              {loginError && (
                <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{loginErrorMsg}</p>
              )}
              <Button className="full-width" onClick={handleLogin}>Log In</Button>
              <p className="center-text muted">
                Don't have an account?{' '}
                <button className="link-btn" onClick={() => setPage('signup')}>Sign Up</button>
              </p>
            </Card>
          </div>
        )}

        {/* ── SIGNUP ── */}
        {page === 'signup' && (
          <div className="centered-page">
            <Card className="auth-card">
              <h2>Create Account</h2>
              <p className="muted">Join SkillLink as a client or service specialist</p>
              <div className="stack gap-16">
                <InputField
                  placeholder="Full Name"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                />
                {signupErrors.name && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.name}</p>}

                <InputField
                  placeholder="Email Address"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                />
                {signupErrors.email && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.email}</p>}

                <InputField
                  placeholder="Phone Number"
                  value={user.phone}
                  maxLength={16}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d+\s\-]/g, '');
                    setUser({ ...user, phone: val });
                  }}
                />
                {signupErrors.phone && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.phone}</p>}

                <select
                  className="select"
                  value={user.country}
                  onChange={(e) => setUser({ ...user, country: e.target.value, city: '' })}
                >
                  <option value="">Select Country</option>
                  <option value="Kazakhstan">Kazakhstan</option>
                  <option value="Russia">Russia</option>
                  <option value="USA">USA</option>
                  <option value="China">China</option>
                  <option value="Germany">Germany</option>
                  <option value="Uzbekistan">Uzbekistan</option>
                  <option value="Sweden">Sweden</option>
                </select>
                {signupErrors.country && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.country}</p>}

                {user.country && (
                  <select
                    className="select"
                    value={user.city}
                    onChange={(e) => setUser({ ...user, city: e.target.value })}
                  >
                    <option value="">Select City</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                )}
                {user.country && signupErrors.city && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.city}</p>}

                <div style={{ position: 'relative' }}>
                  <InputField
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {signupErrors.password && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.password}</p>}

                <div style={{ position: 'relative' }}>
                  <InputField
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {signupErrors.confirmPassword && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.confirmPassword}</p>}

                <select
                  className="select"
                  value={role}
                  onChange={(e) => { const r = e.target.value as Role; setRole(r); setUser({ ...user, role: r }); }}
                >
                  <option value="client">Client</option>
                  <option value="specialist">Specialist</option>
                </select>
              </div>

              <Button
                className="full-width"
                onClick={() => {
                  const errors: Record<string, string> = {};
                  const nameParts = user.name.trim().split(' ').filter(Boolean);
                  if (!user.name) {
                    errors.name = 'Full name is required';
                  } else if (nameParts.length < 2) {
                    errors.name = 'Enter first and last name (e.g. Name Surname)';
                  }
                  if (!user.email) {
                    errors.email = 'Email is required';
                  } else if (!user.email.includes('@')) {
                    errors.email = 'Email must contain @';
                  }
                  if (!user.phone) {
                    errors.phone = 'Phone number is required';
                  } else if (!user.phone.startsWith('+')) {
                    errors.phone = 'Phone must start with +';
                  } else if (!/^\+[0-9\s\-]{6,15}$/.test(user.phone)) {
                    errors.phone = 'Invalid phone format (e.g. +7 777 123 4567)';
                  } else if (user.phone.replace(/\D/g, '').length < 7) {
                    errors.phone = 'Phone number is too short';
                  } else if (user.phone.replace(/\D/g, '').length > 15) {
                    errors.phone = 'Phone number is too long';
                  }
                  if (!user.country) errors.country = 'Please select a country';
                  if (!user.city) errors.city = 'Please select a city';
                  if (!password) {
                    errors.password = 'Password is required';
                  } else if (password.length < 6) {
                    errors.password = 'Password must be at least 6 characters';
                  } else if (!/\d/.test(password)) {
                    errors.password = 'Password must contain at least one number';
                  }
                  if (password && confirmPassword && password !== confirmPassword) {
                    errors.confirmPassword = 'Passwords do not match';
                  }
                  setSignupErrors(errors);
                  if (Object.keys(errors).length > 0) return;
                  try {
                    registerUser({ ...user, password, role });
                    localStorage.setItem('currentUser', JSON.stringify({ ...user, role }));
                    setUser({ ...user, role });
                    goHomeForRole();
                  } catch (e: any) {
                    setSignupErrors({ email: e.message });
                  }
                }}
              >
                Register
              </Button>
              <p className="center-text muted">
                Already have an account?{' '}
                <button className="link-btn" onClick={() => setPage('login')}>Log In</button>
              </p>
            </Card>
          </div>
        )}

        {/* ── HOME ── */}
        {page === 'home' && (
          <div className="stack gap-32">
            <section className="banner">
              <div>
                <p className="banner-eyebrow">Hello, {user.name || 'there'}</p>
                <h2>What service do you need today?</h2>
                <p className="banner-text">Search trusted specialists and book in a few clicks.</p>
              </div>
              <div className="searchbar large-search">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage('listing'); }}
                  placeholder="Search for services or specialists"
                />
                <Button variant="secondary" className="small-btn" onClick={() => setPage('listing')}>
                  <Search size={16} /> Search
                </Button>
              </div>
            </section>

            <section>
              <SectionHeader title="Service Categories" />
              <div className="cards-grid three-cols">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <motion.button whileHover={{ y: -3 }} key={cat.id} className="category-card"
                      onClick={() => { setSelectedCategory(cat.id); setPage('listing'); }}>
                      <IconBadge><Icon size={24} /></IconBadge>
                      <h3>{cat.label}</h3>
                      <p>{cat.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {offers.length > 0 && (
              <section>
                <SectionHeader title="Service Offers" />
                <div className="cards-grid three-cols">
                  {offers.map((offer) => {
                    // find the specialist by name to get rating/reviews
                    const sp = specialistsSeed.find(
                      (s) => s.name === offer.specialistName
                    );
                    return (
                      <Card key={offer.id}>
                        <div
                          className="specialist-head"
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
                        >
                          <Avatar name={offer.specialistName} />
                          <div style={{ flex: 1 }}>
                            <div className="name-row">
                              <h3 style={{ margin: 0 }}>{offer.specialistName}</h3>
                              {sp?.verified && <ShieldCheck size={16} className="blue-icon" />}
                            </div>
                            <p className="muted small-text">{offer.title}</p>
                          </div>
                          <Badge tone="soft">From ${offer.price}</Badge>
                        </div>

                        {sp && (
                          <div className="rating-row">
                            <Stars value={sp.rating} />
                            <span>{sp.rating}</span>
                            <span className="muted">({sp.reviews} reviews)</span>
                          </div>
                        )}

                        <p className="muted small-text mt-12">{offer.description}</p>
                        
                        {offer.tags.length > 0 && (
                          <div className="tag-row mt-12">
                            {offer.tags.map((tag) => (
                              <Badge key={tag}>{tag}</Badge>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          {sp && (
                            <Button
                              variant="secondary"
                              className="flex-1"
                              onClick={() => {
                                setSelectedSpecialistId(sp.id);
                                setPage('profile');
                              }}
                            >
                              View Profile
                            </Button>
                          )}
                          <Button
                            className="flex-1"
                            onClick={() => {
                              setSelectedOffer(offer);
                              if (sp) setSelectedSpecialistId(sp.id);
                              setPage('booking');
                            }}
                          >
                            Hire
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <SectionHeader title="Featured Specialists" action={<Button variant="secondary" onClick={() => setPage('listing')}>View All</Button>} />
              <div className="cards-grid three-cols">
                {specialistsSeed.map((sp) => (
                  <Card key={sp.id}>
                    <div className="specialist-head" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <Avatar name={sp.name} />
                      <div style={{ flex: 1 }}>
                        <div className="name-row">
                          <h3 style={{ margin: 0 }}>{sp.name}</h3>
                          {sp.verified && <ShieldCheck size={16} className="blue-icon" />}
                        </div>
                        <p className="muted small-text">{sp.title}</p>
                      </div>
                      <Badge tone="soft">From ${sp.price}</Badge>
                    </div>
                    <div className="rating-row"><Stars value={sp.rating} /><span>{sp.rating}</span><span className="muted">({sp.reviews} reviews)</span></div>
                    <div className="tag-row">{sp.skills.slice(0, 3).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <Button variant="secondary" className="flex-1" onClick={() => { setSelectedSpecialistId(sp.id); setPage('profile'); }}>View Profile</Button>
                      <Button className="flex-1" onClick={() => { setSelectedSpecialistId(sp.id); setPage('booking'); }}>Hire</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── LISTING ── */}
        {page === 'listing' && (
          <div className="stack gap-24">
            <div className="toolbar">
              <div className="searchbar">
                <Search size={18} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search specialists" />
              </div>
              <div className="filters-row">
                <select className="select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
                <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="rating">Highest Rated</option>
                  <option value="price">Lowest Price</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
            <div className="cards-grid two-cols">
              {filteredSpecialists.map((sp) => (
                <Card key={sp.id}>
                  <div className="listing-card">
                    <div className="listing-main">
                      <Avatar name={sp.name} />
                      <div>
                        <div className="name-row">
                          <h3>{sp.name}</h3>
                          {sp.verified && <ShieldCheck size={16} className="blue-icon" />}
                        </div>
                        <p className="muted">{sp.title}</p>
                        <div className="rating-row"><Stars value={sp.rating} /><span>{sp.rating}</span><span className="muted">({sp.reviews} reviews)</span></div>
                        <div className="tag-row">{sp.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
                        <p className="muted small-text mt-12">{sp.description}</p>
                      </div>
                    </div>
                    <div className="listing-actions">
                      <Badge tone="soft">From ${sp.price}</Badge>
                      <Button variant="secondary" onClick={() => { setSelectedSpecialistId(sp.id); setPage('profile'); }}>View Profile</Button>
                      <Button onClick={() => { setSelectedSpecialistId(sp.id); setPage('booking'); }}>Hire</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {page === 'profile' && (
          <div className="profile-grid">
            <Card>
              <div className="profile-top">
                <Avatar name={selectedSpecialist.name} />
                <div className="profile-main">
                  <div className="name-row">
                    <h2>{selectedSpecialist.name}</h2>
                    {selectedSpecialist.verified && <Badge tone="soft">Verified</Badge>}
                  </div>
                  <p className="profile-role">{selectedSpecialist.title}</p>
                  <div className="rating-row"><Stars value={selectedSpecialist.rating} /><span>{selectedSpecialist.rating} ({selectedSpecialist.reviews} reviews)</span></div>
                  <div className="tag-row">{selectedSpecialist.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
                  <p className="muted mt-12">{selectedSpecialist.description}</p>
                  <div className="contact-grid">
                    <div className="contact-item"><Phone size={18} className="blue-icon" /><span>{selectedSpecialist.phone}</span></div>
                    <div className="contact-item"><Mail size={18} className="blue-icon" /><span>{selectedSpecialist.email}</span></div>
                  </div>
                </div>
                <Card className="price-card">
                  <p className="muted">Starting from</p>
                  <h2 className="price-hero">${selectedSpecialist.price}</h2>
                  <Button className="full-width" onClick={() => setPage('booking')}>Book Service</Button>
                </Card>
              </div>
            </Card>
            <div className="side-stack">
              <Card>
                <h3>Certifications</h3>
                <div className="tag-row mt-12">{selectedSpecialist.certifications.map((item) => <Badge key={item} tone="success">{item}</Badge>)}</div>
              </Card>
              <Card>
                <h3>Portfolio</h3>
                <div className="stack gap-12 mt-12">{selectedSpecialist.portfolio.map((item) => <div key={item} className="soft-box">{item}</div>)}</div>
              </Card>
            </div>
            <Card className="full-span">
              <h3>Customer Reviews</h3>
              <div className="cards-grid two-cols mt-16">
                {reviews.map((r) => (
                  <div key={r.id} className="review-box">
                    <div className="between-row"><strong>{r.name}</strong><Stars value={r.rating} /></div>
                    <p className="muted mt-12">{r.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── BOOKING ── */}
        {page === 'booking' && (
          <div className="booking-grid">
            <Card>
              <h2>Book Service</h2>
              <div className="soft-box mt-16">
                <strong>{selectedOffer ? selectedOffer.specialistName : selectedSpecialist.name}</strong>
                <p className="muted small-text">{selectedOffer ? selectedOffer.title : selectedSpecialist.title}</p>
              </div>
              <div className="double-grid mt-16">
                <div>
                  <label className="field-label">Select Date</label>
                  <div className="field-icon-wrap">
                    <Calendar size={18} />
                    <InputField
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Select Time</label>
                  <div className="field-icon-wrap">
                    <Clock size={18} />
                    <InputField
                      type="time"
                      value={bookingTime}
                      min={bookingDate === new Date().toISOString().split('T')[0] ? getMinTime() : '00:00'}
                      disabled={!bookingDate}
                      onChange={(e) => {
                        const t = e.target.value;
                        const min = bookingDate === new Date().toISOString().split('T')[0] ? getMinTime() : '00:00';
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
              <Button
                className="full-width mt-16"
                onClick={() => {
                  if (!bookingDate) {
                    alert('Please select a date');
                    return;
                  }
                  const today = new Date().toISOString().split('T')[0];
                  if (bookingDate < today) {
                    alert('Please select a future date');
                    return;
                  }
                  if (bookingDate === today && bookingTime < getMinTime()) {
                    alert('Please select a future time for today');
                    return;
                  }
                  handleBookingConfirm();
                }}
              >
                Confirm Booking
              </Button>
            </Card>
            <Card>
              <h2>Price Summary</h2>
              <div className="summary-row mt-16"><span>Service Fee</span><span>${selectedOffer ? selectedOffer.price : selectedSpecialist.price}</span></div>
              <div className="summary-row"><span>Platform Fee</span><span>$3</span></div>
              <div className="summary-row summary-total"><span>Total</span><span>${(selectedOffer ? selectedOffer.price : selectedSpecialist.price) + 3}</span></div>
              <div className="soft-blue-box mt-16">Your booking request will be sent instantly and the specialist will receive a notification.</div>
            </Card>
          </div>
        )}

        {/* ── CONFIRMATION ── */}
        {page === 'confirmation' && (
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
        )}

        {/* ── TRACKING ── */}
          {page === 'tracking' && (
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
                      <p><strong>Current Status:</strong> {selectedBooking.status}</p>
                    </div>

                    <div className="mt-16">
                      <StepTracker status={selectedBooking.status} />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                      {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Accepted') && (
                        <Button onClick={() => cancelBooking(selectedBooking.id)}>
                          Cancel Order
                        </Button>
                      )}

                      <Button variant="secondary" onClick={() => setPage('contact')}>
                        Contact Specialist
                      </Button>
                    </div>

                    {selectedBooking.status === 'Completed' && (
                      <div className="success-box mt-16">
                        Service completed successfully. You can now leave a review.
                        <div className="mt-12">
                          <Button onClick={() => setPage('feedback')}>Leave Review</Button>
                        </div>
                      </div>
                    )}
                    {selectedBooking.status === 'Cancelled' && (
                      <div
                        className="mt-16"
                        style={{
                          background: '#fef2f2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          borderRadius: '16px',
                          padding: '16px',
                          fontWeight: 500,
                        }}
                      >
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
          )}

        {/* ── FEEDBACK ── */}
        {page === 'feedback' && (
          <div className="centered-page wide">
            <Card className="auth-card wide-card">
              <h2>Leave a Review</h2>
              <div className="soft-box mt-16">
                <strong>{selectedSpecialist.name}</strong>
                <p className="muted small-text">{selectedSpecialist.title}</p>
              </div>
              <div className="mt-16">
                <label className="field-label">Rate Your Experience</label>
                <div className="star-picker">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} className="star-btn" onClick={() => setReviewRating(i + 1)}>
                      <Star size={30} className={i < reviewRating ? 'star active' : 'star'} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-16">
                <label className="field-label">Comment</label>
                <TextArea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your feedback about the service" />
              </div>
              <Button className="full-width mt-16" onClick={submitReview}>Submit Review</Button>
            </Card>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {page === 'dashboard' && (
          <div className="stack gap-32">
            <div className="cards-grid four-cols">
              {[
                
                { label: 'My Offers', value: String(specialistOffers.length), icon: Briefcase },
                { label: 'Booked Orders', value: String(specialistBookings.length), icon: Calendar },
                { label: 'Completed Orders', value: String(completedSpecialistBookings.length), icon: CheckCircle2 },
                { label: 'Total Earnings', value: `$${specialistTotalEarnings}`, icon: DollarSign },
              ].map((item) => {
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
                    specialistBookings.map((job) => (
                      <div key={job.id} className="job-row">
                        <div>
                          <strong>{job.service}</strong>
                          <p className="muted small-text">Client: {job.client}</p>
                          <p className="muted small-text">{job.date} at {job.time}</p>
                        </div>
                        <div className="button-row end-row">
                          <Badge tone="soft">{job.status}</Badge>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelectedBookingId(job.id);
                              setPage('contact');
                            }}
                          >
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
              <SectionHeader title="My Offers" action={<Button variant="secondary" onClick={() => setPage('myOffers')}>View All</Button>} />
              <div className="stack gap-12">
                {offers.filter((o) => o.specialistName === user.name).length === 0 ? (
                  <div className="soft-box">You have not created any offers yet.</div>
                ) : (
                  offers.filter((o) => o.specialistName === user.name).slice(0, 3).map((offer) => (
                    <div key={offer.id} className="job-row">
                      <div>
                        <strong>{offer.title}</strong>
                        <p className="muted small-text">{offer.description}</p>

                        {offer.tags.length > 0 && (
                          <div className="tag-row mt-12">
                            {offer.tags.map((tag) => (
                              <Badge key={tag}>{tag}</Badge>
                            ))}
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
                {['New booking request received.', 'Upcoming job starts in 2 hours.', 'A client left you a 5-star review.'].map((note) => (
                  <div key={note} className="soft-box">{note}</div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── JOBS ── */}
          {page === 'jobs' && (
            <Card>
              <SectionHeader title="Jobs" />
              <div className="stack gap-12">
                {specialistBookings.length === 0 ? (
                  <div className="empty-state">
                    <h3>No Jobs Yet</h3>
                    <p className="muted">Client orders will appear here automatically.</p>
                    <Button variant="secondary" onClick={() => setPage('dashboard')}>
                      Back to Dashboard
                    </Button>
                  </div>
                ) : (
                  specialistBookings.map((job) => (
                    <div key={job.id} className="job-row">
                      <div>
                        <strong>{job.service}</strong>
                        <p className="muted small-text">Order ID: {job.id}</p>
                        <p className="muted small-text">Client: {job.client}</p>
                        <p className="muted small-text">Schedule: {job.date} at {job.time}</p>
                        <p className="muted small-text">Details: {job.details}</p>
                        <p className="muted small-text">Total: ${job.total}</p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          alignItems: 'flex-end',
                        }}
                      >
                        <Badge tone="soft">{job.status}</Badge>

                        {job.status === 'Pending' && (
                          <Button onClick={() => updateBookingStatus(job.id)}>
                            Accept
                          </Button>
                        )}

                        {job.status === 'Accepted' && (
                          <Button onClick={() => updateBookingStatus(job.id)}>
                            Start Work
                          </Button>
                        )}

                        {job.status === 'In Progress' && (
                          <Button onClick={() => updateBookingStatus(job.id)}>
                            Complete
                          </Button>
                        )}

                        {job.status === 'Completed' && (
                          <Button variant="secondary">
                            Done
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

        {/* ── MY OFFERS ── */}
        {page === 'myOffers' && (
          <Card>
            <SectionHeader
              title="My Offers"
              action={<Button onClick={() => setPage('createOffer')}>+ Create Offer</Button>}
            />
            {offers.filter((o) => o.specialistName === user.name).length === 0 ? (
              <div className="empty-state">
                <h3>No Offers Yet</h3>
                <p className="muted">Create your first service offer to start getting clients.</p>
                <Button onClick={() => setPage('createOffer')}>Create Offer</Button>
              </div>
            ) : (
              <div className="stack gap-12">
                {offers.filter((o) => o.specialistName === user.name).map((offer) => (
                  <div key={offer.id} className="job-row">
                    <div>
                      <strong>{offer.title}</strong>
                      <p className="muted small-text">{offer.description}</p>
                        <p className="muted small-text">Category: {offer.category}</p>

                        {offer.tags.length > 0 && (
                          <div className="tag-row mt-12">
                            {offer.tags.map((tag) => (
                              <Badge key={tag}>{tag}</Badge>
                            ))}
                          </div>
                        )}
                    </div>
                    <Badge tone="soft">${offer.price}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── CREATE OFFER ── */}
        {page === 'createOffer' && (
          <div className="centered-page">
            <Card className="auth-card">
              <h2>Create Service Offer</h2>
              <InputField
                placeholder="Service Title"
                value={offerTitle}
                maxLength={20}
                onChange={(e) => setOfferTitle(e.target.value.slice(0, 20))}
              />
              <p className="muted small-text" style={{ marginTop: '6px' }}>
                {offerTitle.length}/20 characters
              </p>
              <TextArea
                placeholder="Describe your service"
                value={offerDescription}
                maxLength={100}
                onChange={(e) => setOfferDescription(e.target.value.slice(0, 100))}
                style={{ resize: 'none' }}
              />
              <p className="muted small-text" style={{ marginTop: '6px' }}>
                {offerDescription.length}/100 characters
              </p>
              <div className="mt-16">
  <label className="field-label">Service Tags</label>

  <div
    className="soft-box"
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'center',
      minHeight: '52px',
    }}
  >
    {offerTags.map((tag) => (
      <div
        key={tag}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#eef2ff',
          color: '#3730a3',
          borderRadius: '999px',
          padding: '6px 10px',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <span>{tag}</span>

        <button
          type="button"
          onClick={() => removeOfferTag(tag)}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: 0,
            color: 'inherit',
          }}
        >
          <X size={14} />
        </button>
      </div>
    ))}

    <input
      value={offerTagInput}
      onChange={(e) => setOfferTagInput(e.target.value)}
      onKeyDown={handleOfferTagKeyDown}
      onBlur={handleOfferTagBlur}
      placeholder="Type tag and press space"
      style={{
        border: 'none',
        outline: 'none',
        flex: 1,
        minWidth: '160px',
        background: 'transparent',
        fontSize: '14px',
      }}
    />
  </div>

  <p className="muted small-text" style={{ marginTop: '6px' }}>
    Example: fast_cleaning urgent home_service. Max 6 tags.
  </p>
</div>
              <InputField
                  type="number"
                  placeholder="Price ($)"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                />
              <p className="muted small-text" style={{ marginTop: '6px' }}>
                Price range: $10 - $1000
              </p>
              <select className="select" value={offerCategory} onChange={(e) => setOfferCategory(e.target.value)}>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
              <Button
                className="full-width"
                onClick={() => {
                if (!offerTitle.trim() || !offerDescription.trim() || !offerPrice) {
                  alert('Fill all fields');
                  return;
                }

                if (offerTitle.length > 20) {
                  alert('Service title must be no more than 20 characters');
                  return;
                }

                if (offerDescription.length > 100) {
                  alert('Description must be no more than 100 characters');
                  return;
                }

                const numericPrice = Number(offerPrice);

                if (Number.isNaN(numericPrice)) {
                  alert('Enter a valid price');
                  return;
                }

                if (numericPrice < 10 || numericPrice > 1000) {
                  alert('Price must be between $10 and $1000');
                  return;
                }

                const pendingTag = offerTagInput.trim();

let finalTags = [...offerTags];

if (
  pendingTag &&
  !finalTags.some((tag) => tag.toLowerCase() === pendingTag.toLowerCase()) &&
  finalTags.length < 6
) {
  finalTags.push(pendingTag);
}

setOffers((prev) => [
  {
    id: `OFF-${Date.now()}`,
    title: offerTitle.trim(),
    description: offerDescription.trim(),
    price: numericPrice,
    category: offerCategory,
    specialistName: user.name,
    tags: finalTags,
  },
  ...prev,
]);

setOfferTitle('');
setOfferDescription('');
setOfferPrice('');
setOfferTags([]);
setOfferTagInput('');
setPage('dashboard');
}}
              >
                Publish Offer
              </Button>
            </Card>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {page === 'bookings' && (
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
                {bookings.map((b) => (
                  <div key={b.id} className="job-row">
                    <div>
                      <strong>{b.service}</strong>
                      <p className="muted small-text">Specialist: {b.specialist}</p>
                      <p className="muted small-text">{b.date} at {b.time}</p>
                    </div>
                    <div className="button-row end-row">
                      <Badge tone="soft">{b.status}</Badge>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedBookingId(b.id);
                          setPage('tracking');
                        }}
                      >
                        Track
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── NOTIFICATIONS ── */}
        {page === 'notifications' && (
          <Card>
            <SectionHeader title="Notifications" />
            <div className="stack gap-12">
              {notifications.map((item) => (
                <div key={item.id} className="notice-row">
                  <IconBadge><Bell size={18} /></IconBadge>
                  <div>
                    <strong>Notification</strong>
                    <p className="muted mt-8">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

{/* ── USER PROFILE ── */}
{page === 'userProfile' && (
  <div className="profile-grid alt-grid">
    <Card>
      <div className="profile-box-center">
        <Avatar
          name={user.name || 'User'}
          image={selectedAvatar}
          onClick={() => setShowAvatarPicker(true)}
        />
        <p className="muted small-text" style={{ marginTop: '6px' }}>Tap avatar to change</p>
        <h2 className="mt-12">{user.name || 'User'}</h2>
        <p className="muted">
          {user.role === 'client' ? 'Client Account' : 'Specialist Account'}
        </p>
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
            <span>
              {user.country && user.city ? `${user.country}, ${user.city}` : 'No location'}
            </span>
          </div>
        </div>
        <Button
          className="full-width"
          style={{ marginTop: '16px' }}
          onClick={() => {
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
          }}
        >
          ✏️ Edit Profile
        </Button>
      </div>
    </Card>

    <Card>
      {user.role === 'specialist' && (
        <>
          <SectionHeader title="Account Overview" />
          <div className="cards-grid two-cols mt-16">
            <div className="soft-box">
              <p className="muted small-text">My Offers</p>
              <h2>{specialistOffers.length}</h2>
            </div>
            <div className="soft-box">
              <p className="muted small-text">Total Orders</p>
              <h2>{specialistBookings.length}</h2>
            </div>
            <div className="soft-box">
              <p className="muted small-text">Completed Orders</p>
              <h2>{completedSpecialistBookings.length}</h2>
            </div>
            <div className="soft-box">
              <p className="muted small-text">Total Earnings</p>
              <h2>${specialistTotalEarnings}</h2>
            </div>
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
          onClick={() => setShowLogoutConfirm(true)}
        >
          Log Out
        </button>
      </div>
    </Card>
  </div>
)}
        {/* ── CONTACT ── */}
        {page === 'contact' && (
  <Card>
    {!selectedBooking || !canOpenOrderChat ? (
      <div className="empty-state">
        <h3>No Chat Available</h3>
        <p className="muted">
          Open chat from a real order between client and specialist.
        </p>
        <Button
          variant="secondary"
          onClick={() => setPage(user.role === 'specialist' ? 'jobs' : 'bookings')}
        >
          Go Back
        </Button>
      </div>
    ) : (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2 style={{ marginBottom: '6px' }}>Chat with {chatPartnerName}</h2>
            <p className="muted small-text">
              Order ID: {selectedBooking.id} • {selectedBooking.service}
            </p>
          </div>

          <Badge tone="soft">{selectedBooking.status}</Badge>
        </div>

        <div className="chat-box">
          {currentChatMessages.length === 0 ? (
            <div className="soft-box">
              No messages yet. Start the conversation.
            </div>
          ) : (
            currentChatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${
                  msg.senderEmail === user.email ? 'user' : 'specialist'
                }`}
              >
                <div>{msg.text}</div>
                <div
                  style={{
                    fontSize: '12px',
                    opacity: 0.7,
                    marginTop: '6px',
                  }}
                >
                  {msg.senderName}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="chat-input">
          <input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendOrderMessage();
              }
            }}
            placeholder="Type message..."
          />
          <Button onClick={sendOrderMessage}>Send</Button>
        </div>
      </>
    )}
  </Card>
)}

      </main>

      {/* ── BOTTOM NAV ── */}
      {!['welcome', 'login', 'signup'].includes(page) && (
        <BottomNav
          role={role}
          active={
            page === 'userProfile' ? 'profile'
            : ['tracking', 'confirmation', 'feedback', 'listing', 'profile', 'booking'].includes(page)
              ? (role === 'client' ? 'home' : 'dashboard')
              : page
          }
          onNavigate={(target) => {
            if (target === 'profile') { setPage('userProfile'); return; }
            setPage(target as Page);
          }}
        />
      )}

      {/* ── AVATAR PICKER MODAL ── */}
      {showAvatarPicker && (
        <div className="modal-overlay" onClick={() => setShowAvatarPicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Choose profile icon</h3>
            <p className="muted">Pick an icon for your profile</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => { setSelectedAvatar(avatar); setShowAvatarPicker(false); }}
                  style={{ border: selectedAvatar === avatar ? '2px solid #4f46e5' : '1px solid #ddd', borderRadius: '12px', padding: '4px', background: 'white', cursor: 'pointer' }}
                >
                  <img src={avatar} alt={`avatar-${index}`} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '10px' }} />
                </button>
              ))}
            </div>
            <div className="button-row mt-16">
              <Button variant="secondary" onClick={() => setShowAvatarPicker(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGOUT CONFIRM MODAL ── */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Log out?</h3>
            <p className="muted">Are you sure you want to log out of your account?</p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
              <Button onClick={() => { handleLogout(); setShowLogoutConfirm(false); }}>Log Out</Button>
            </div>
          </div>
        </div>
      )}
      {/* ── EDIT PROFILE MODAL ── */}
    {isEditingProfile && (
      <div className="modal-overlay" onClick={() => setIsEditingProfile(false)}>
        <div className="modal" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <h3>Edit Profile</h3>
          <p className="muted" style={{ marginBottom: '16px' }}>Update your account information</p>

          {editSuccess && (
            <p style={{ color: 'green', fontSize: '14px', marginBottom: '12px', background: '#f0fdf4', padding: '10px', borderRadius: '8px' }}>
              ✅ {editSuccess}
            </p>
          )}

          {/* Avatar */}
          <p className="field-label">Profile Avatar</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {avatarOptions.map((avatar, index) => (
              <button
                key={index}
                onClick={() => setSelectedAvatar(avatar)}
                style={{ border: selectedAvatar === avatar ? '2px solid #4f46e5' : '1px solid #ddd', borderRadius: '50%', padding: '2px', background: 'white', cursor: 'pointer', width: '52px', height: '52px', overflow: 'hidden' }}
              >
                <img src={avatar} alt={`avatar-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              </button>
            ))}
          </div>

          {/* Name */}
          <p className="field-label">Full Name</p>
          <InputField
            placeholder="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ marginBottom: '4px' }}
          />
          {editErrors.name && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.name}</p>}

          {/* Email */}
          <p className="field-label" style={{ marginTop: '12px' }}>Email</p>
          <InputField
            placeholder="Email Address"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            style={{ marginBottom: '4px' }}
          />
          {editErrors.email && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.email}</p>}
          {editEmail !== user.email && editEmail.includes('@') && (
            <p style={{ color: '#4f46e5', fontSize: '12px', marginBottom: '8px' }}>
              📧 A confirmation will be sent to your new email
            </p>
          )}

          {/* Phone */}
          <p className="field-label" style={{ marginTop: '12px' }}>Phone</p>
          <InputField
            placeholder="Phone Number"
            value={editPhone}
            maxLength={16}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d+\s\-]/g, '');
              setEditPhone(val);
            }}
            style={{ marginBottom: '4px' }}
          />
          {editErrors.phone && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.phone}</p>}

          {/* Country */}
          <p className="field-label" style={{ marginTop: '12px' }}>Country</p>
          <select
            className="select"
            value={editCountry}
            onChange={(e) => { setEditCountry(e.target.value); setEditCity(''); }}
            style={{ marginBottom: '4px' }}
          >
            <option value="">Select Country</option>
            {Object.keys(countriesWithCities).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {editErrors.country && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.country}</p>}

          {/* City */}
          {editCountry && (
            <>
              <p className="field-label" style={{ marginTop: '12px' }}>City</p>
              <select
                className="select"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                style={{ marginBottom: '4px' }}
              >
                <option value="">Select City</option>
                {(countriesWithCities[editCountry] || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {editErrors.city && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.city}</p>}
            </>
          )}

          {/* Change Password section */}
          <div style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '16px' }}>
            <p style={{ fontWeight: '600', marginBottom: '12px' }}>Change Password <span className="muted" style={{ fontWeight: 400, fontSize: '13px' }}>(optional)</span></p>

              <p className="field-label">Current Password</p>
              <div style={{ position: 'relative', marginBottom: '4px' }}>
                <InputField
                  type={showEditOldPass ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={editOldPassword}
                  onChange={(e) => setEditOldPassword(e.target.value)}
                  style={{ paddingRight: '42px' }}
                />
                <button type="button" onClick={() => setShowEditOldPass(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                  {showEditOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {editErrors.oldPassword && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.oldPassword}</p>}

              <p className="field-label" style={{ marginTop: '12px' }}>New Password</p>
              <div style={{ position: 'relative', marginBottom: '4px' }}>
                <InputField
                  type={showEditNewPass ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  style={{ paddingRight: '42px' }}
                />
                <button type="button" onClick={() => setShowEditNewPass(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                  {showEditNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {editErrors.newPassword && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.newPassword}</p>}

              <p className="field-label" style={{ marginTop: '12px' }}>Confirm New Password</p>
              <div style={{ position: 'relative', marginBottom: '4px' }}>
                <InputField
                  type={showEditConfirmPass ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={editConfirmPassword}
                  onChange={(e) => setEditConfirmPassword(e.target.value)}
                  style={{ paddingRight: '42px' }}
                />
                <button type="button" onClick={() => setShowEditConfirmPass(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                  {showEditConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {editErrors.confirmPassword && <p style={{ color: 'red', fontSize: '13px', marginBottom: '8px' }}>{editErrors.confirmPassword}</p>}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
              <Button onClick={() => {
                const errors: Record<string, string> = {};

                // Name
                const nameParts = editName.trim().split(' ').filter(Boolean);
                if (!editName.trim()) errors.name = 'Full name is required';
                else if (nameParts.length < 2) errors.name = 'Enter first and last name';

                // Email
                if (!editEmail.trim()) errors.email = 'Email is required';
                else if (!editEmail.includes('@')) errors.email = 'Email must contain @';

                // Phone
                if (!editPhone.trim()) errors.phone = 'Phone is required';
                else if (!editPhone.startsWith('+')) errors.phone = 'Phone must start with +';
                else if (editPhone.replace(/\D/g, '').length < 7) errors.phone = 'Phone is too short';

                // Country/City
                if (!editCountry) errors.country = 'Please select a country';
                if (editCountry && !editCity) errors.city = 'Please select a city';

                // Password (only if user typed something)
                if (editOldPassword || editNewPassword || editConfirmPassword) {
                  const users = getUsers();
                  const currentUser = users.find(u => u.email === user.email);
                  if (!editOldPassword) {
                    errors.oldPassword = 'Enter your current password';
                  } else if (currentUser && currentUser.password !== editOldPassword) {
                    errors.oldPassword = 'Current password is incorrect';
                  }
                  if (!editNewPassword) {
                    errors.newPassword = 'Enter new password';
                  } else if (editNewPassword.length < 6) {
                    errors.newPassword = 'Min 6 characters';
                  } else if (!/\d/.test(editNewPassword)) {
                    errors.newPassword = 'Must contain at least one number';
                  }
                  if (editNewPassword && editConfirmPassword && editNewPassword !== editConfirmPassword) {
                    errors.confirmPassword = 'Passwords do not match';
                  }
                }

                setEditErrors(errors);
                if (Object.keys(errors).length > 0) return;

                // Save
                const users = getUsers();
                const idx = users.findIndex(u => u.email === user.email);
                if (idx !== -1) {
                  users[idx].name = editName.trim();
                  users[idx].email = editEmail.trim();
                  users[idx].phone = editPhone.trim();
                  users[idx].country = editCountry;
                  users[idx].city = editCity;
                  if (editNewPassword) users[idx].password = editNewPassword;
                  saveUsers(users);
                }

                const updatedUser = { ...user, name: editName.trim(), email: editEmail.trim(), phone: editPhone.trim(), country: editCountry, city: editCity };
                setUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));

                setEditSuccess('Profile updated successfully!');
                setTimeout(() => {
                  setIsEditingProfile(false);
                  setEditSuccess('');
                }, 1500);
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── FORGOT PASSWORD MODAL ── */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reset Password</h3>
            {forgotSent ? (
              <>
                <p className="muted" style={{ marginTop: '12px' }}>
                  If an account with <strong>{forgotEmail}</strong> exists, a reset link has been sent.
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <Button className="full-width" onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(''); }}>
                    Back to Login
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="muted" style={{ marginTop: '8px' }}>Enter your email and we'll send a reset link.</p>
                <InputField
                  placeholder="Email Address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ marginTop: '16px' }}
                />
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <Button variant="secondary" onClick={() => { setShowForgotPassword(false); setForgotEmail(''); }}>Cancel</Button>
                  <Button onClick={() => {
                    if (!forgotEmail.includes('@')) { alert('Please enter a valid email with @'); return; }
                    setForgotSent(true);
                  }}>
                    Send Reset Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
