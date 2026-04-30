import { Card, Button, InputField } from '../components/ui';
import type { Page } from '../types';

type Props = {
  setPage: (p: Page) => void;
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  loginError: boolean;
  loginErrorMsg: string;
  handleLogin: () => void;
  setShowForgotPassword: (v: boolean) => void;
};

export default function LoginPage({
  setPage, loginEmail, setLoginEmail,
  loginPassword, setLoginPassword,
  loginError, loginErrorMsg,
  handleLogin, setShowForgotPassword,
}: Props) {
  return (
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
          <p style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>{loginErrorMsg}</p>
        )}

        <Button className="full-width" onClick={handleLogin}>Log In</Button>

        <p className="center-text muted">
          Don't have an account?{' '}
          <button className="link-btn" onClick={() => setPage('signup')}>Sign Up</button>
        </p>
      </Card>
    </div>
  );
}