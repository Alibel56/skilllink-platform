import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { auth, readFieldErrors } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setServerError('');
    setSubmitting(true);
    try {
      const res = await auth.login(values);
      setToken(res.access_token);
      const from = (location.state as { from?: string } | null)?.from ?? '/home';
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (e) {
      const fields = readFieldErrors(e);
      if (fields) {
        for (const [name, msg] of Object.entries(fields)) {
          if (name === 'email' || name === 'password') {
            setError(name, { type: 'server', message: msg });
          }
        }
      }
      setServerError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot() {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await auth.forgotPassword(forgotEmail);
      toast.success('If that email exists, a reset link is on its way.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send reset link');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Log in to continue using SkillLink.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email address" required error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" required error={errors.password?.message}>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
          />
        </FormField>

        {serverError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => setForgotEmail(watch('email') ?? '')}
              >
                Forgot password?
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset your password</DialogTitle>
                <DialogDescription>
                  We'll email you a link to set a new password.
                </DialogDescription>
              </DialogHeader>
              <FormField label="Email">
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </FormField>
              <DialogFooter>
                <Button onClick={handleForgot} loading={forgotLoading} disabled={!forgotEmail}>
                  Send reset link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Log in
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
