import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { auth } from '@/lib/api';

const schema = z.object({
  new_password: z.string().min(6, 'Min 6 characters').regex(/\d/, 'Must contain a number'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  path: ['confirm_password'], message: 'Passwords do not match',
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold">Invalid reset link</h1>
        <p className="text-sm text-muted-foreground">The reset token is missing or expired.</p>
        <Button asChild variant="outline"><Link to="/login">Back to login</Link></Button>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError('');
    try {
      await auth.resetPassword(token!, values);
      toast.success('Password updated. Please log in.');
      navigate('/login', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">Make it strong — at least 6 characters with a number.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="New password" required error={errors.new_password?.message}>
          <Input type="password" autoComplete="new-password" {...register('new_password')} />
        </FormField>
        <FormField label="Confirm password" required error={errors.confirm_password?.message}>
          <Input type="password" autoComplete="new-password" {...register('confirm_password')} />
        </FormField>
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>
        )}
        <Button type="submit" className="w-full" loading={submitting} size="lg">Update password</Button>
      </form>
    </div>
  );
}
