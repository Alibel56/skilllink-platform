import { Eye, EyeOff } from 'lucide-react';
import { Card, Button, InputField } from '../components/ui';
import { countriesWithCities } from '../data';
import { registerUser } from '../storage';
import type { Page, Role } from '../types';

type Props = {
  setPage: (p: Page) => void;
  user: any;
  setUser: (u: any) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  role: Role;
  setRole: (r: Role) => void;
  signupErrors: Record<string, string>;
  setSignupErrors: (e: Record<string, string>) => void;
  goHomeForRole: () => void;
};

export default function SignupPage({
  setPage, user, setUser, password, setPassword,
  confirmPassword, setConfirmPassword,
  showPassword, setShowPassword,
  showConfirmPassword, setShowConfirmPassword,
  role, setRole, signupErrors, setSignupErrors, goHomeForRole,
}: Props) {
  const availableCities = user.country ? countriesWithCities[user.country] : [];

  const handleRegister = () => {
    const errors: Record<string, string> = {};
    const nameParts = user.name.trim().split(' ').filter(Boolean);

    if (!user.name) errors.name = 'Full name is required';
    else if (nameParts.length < 2) errors.name = 'Enter first and last name';

    if (!user.email) errors.email = 'Email is required';
    else if (!user.email.includes('@')) errors.email = 'Email must contain @';

    if (!user.phone) errors.phone = 'Phone number is required';
    else if (!user.phone.startsWith('+')) errors.phone = 'Phone must start with +';
    else if (!/^\+[0-9\s\-]{6,15}$/.test(user.phone)) errors.phone = 'Invalid phone format';
    else if (user.phone.replace(/\D/g, '').length < 7) errors.phone = 'Phone number is too short';
    else if (user.phone.replace(/\D/g, '').length > 15) errors.phone = 'Phone number is too long';

    if (!user.country) errors.country = 'Please select a country';
    if (!user.city) errors.city = 'Please select a city';

    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Min 6 characters';
    else if (!/\d/.test(password)) errors.password = 'Must contain at least one number';

    if (password && confirmPassword && password !== confirmPassword)
      errors.confirmPassword = 'Passwords do not match';

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
  };

  return (
    <div className="centered-page">
      <Card className="auth-card">
        <h2>Create Account</h2>
        <p className="muted">Join SkillLink as a client or specialist</p>

        <div className="stack gap-16">
          <InputField placeholder="Full Name" value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })} />
          {signupErrors.name && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.name}</p>}

          <InputField placeholder="Email Address" value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })} />
          {signupErrors.email && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.email}</p>}

          <InputField placeholder="Phone Number" value={user.phone} maxLength={16}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d+\s\-]/g, '');
              setUser({ ...user, phone: val });
            }} />
          {signupErrors.phone && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.phone}</p>}

          <select className="select" value={user.country}
            onChange={(e) => setUser({ ...user, country: e.target.value, city: '' })}>
            <option value="">Select Country</option>
            {Object.keys(countriesWithCities).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {signupErrors.country && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.country}</p>}

          {user.country && (
            <select className="select" value={user.city}
              onChange={(e) => setUser({ ...user, city: e.target.value })}>
              <option value="">Select City</option>
              {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {user.country && signupErrors.city && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.city}</p>}

          <div style={{ position: 'relative' }}>
            <InputField type={showPassword ? 'text' : 'password'} placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: '42px' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {signupErrors.password && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.password}</p>}

          <div style={{ position: 'relative' }}>
            <InputField type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat Password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ paddingRight: '42px' }} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {signupErrors.confirmPassword && <p style={{ color: 'red', fontSize: '13px' }}>{signupErrors.confirmPassword}</p>}

          <select className="select" value={role}
            onChange={(e) => { const r = e.target.value as Role; setRole(r); setUser({ ...user, role: r }); }}>
            <option value="client">Client</option>
            <option value="specialist">Specialist</option>
          </select>
        </div>

        <Button className="full-width" onClick={handleRegister}>Register</Button>

        <p className="center-text muted">
          Already have an account?{' '}
          <button className="link-btn" onClick={() => setPage('login')}>Log In</button>
        </p>
      </Card>
    </div>
  );
}