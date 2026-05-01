import { Eye, EyeOff } from 'lucide-react';
import { Card, Button, InputField } from '../components/ui';
import { apiRegister, setToken, apiGetProfile } from '../storage';
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
  const handleRegister = async () => {
    const errors: Record<string, string> = {};

    // Валидация имени
    if (!user.firstName?.trim()) errors.firstName = 'First name is required';
    // Валидация фамилии (surname — обязательно для backend)
    if (!user.surname?.trim()) errors.surname = 'Last name is required';
    // Дата рождения
    if (!user.birth_date) errors.birth_date = 'Date of birth is required';

    if (!user.email) errors.email = 'Email is required';
    else if (!user.email.includes('@')) errors.email = 'Email must contain @';

    if (!user.phone) errors.phone = 'Phone number is required';
    else if (!user.phone.startsWith('+')) errors.phone = 'Phone must start with +';
    else if (!/^\+[0-9\s\-]{6,15}$/.test(user.phone)) errors.phone = 'Invalid phone format';
    else if (user.phone.replace(/\D/g, '').length < 7) errors.phone = 'Phone number is too short';
    else if (user.phone.replace(/\D/g, '').length > 15) errors.phone = 'Phone number is too long';

    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Min 6 characters';
    else if (!/\d/.test(password)) errors.password = 'Must contain at least one number';

    if (password && confirmPassword && password !== confirmPassword)
      errors.confirmPassword = 'Passwords do not match';

    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      // POST /api/v1/auth/register
      // UserCreate: { name, surname, birth_date, phone, email, password }
      await apiRegister({
        name: user.firstName.trim(),
        surname: user.surname.trim(),
        birth_date: user.birth_date,
        phone: user.phone.trim(),
        email: user.email.trim(),
        password,
      });

      // После регистрации — сразу логинимся
      const { apiLogin } = await import('../storage');
      const { access_token } = await apiLogin({ email: user.email.trim(), password });
      setToken(access_token);

      const profile = await apiGetProfile();
      const uiUser = {
        name: `${profile.name} ${profile.surname}`.trim(),
        surname: profile.surname,
        birth_date: profile.birth_date,
        email: profile.email,
        phone: profile.phone,
        role: profile.role as Role,
        country: '',
        city: '',
      };
      setUser({ ...uiUser, role });
      localStorage.setItem('currentUser', JSON.stringify({ ...uiUser, role }));
      goHomeForRole();
    } catch (e: any) {
      setSignupErrors({ email: e.message || 'Registration failed' });
    }
  };

  return (
    <div className="centered-page">
      <Card className="auth-card">