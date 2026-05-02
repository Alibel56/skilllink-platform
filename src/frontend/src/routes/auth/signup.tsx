import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { auth, readFieldErrors } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter a valid phone (with country code)').startsWith('+', 'Phone must start with +'),
  birth_date: z.string().min(1, 'Date of birth is required'),
  password: z.string().min(6, 'Min 6 characters').regex(/\d/, 'Must contain at least one number'),
  confirm: z.string().min(1, 'Confirm your password'),
}).refine((d) => d.password === d.confirm, {
  path: ['confirm'], message: 'Passwords do not match',
});
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const FIELD_NAMES: ReadonlyArray<keyof FormValues> =
    ['name', 'surname', 'email', 'phone', 'birth_date', 'password', 'confirm'];

  async function onSubmit(values: FormValues) {
    setServerError('');
    setSubmitting(true);
    try {
      await auth.register({
        name: values.name.trim(),
        surname: values.surname.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        birth_date: values.birth_date,
        password: values.password,
      });
      toast.success('Account created. Check your email to confirm.');
      navigate('/email-pending', { state: { email: values.email } });
    } catch (e) {
      const fields = readFieldErrors(e);
      if (fields) {
        for (const [name, msg] of Object.entries(fields)) {
          if ((FIELD_NAMES as ReadonlyArray<string>).includes(name)) {
            setError(name as keyof FormValues, { type: 'server', message: msg });
          }
        }
      }
      setServerError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Join SkillLink — it takes a minute.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name" required error={errors.name?.message}>
            <Input placeholder="Alex" autoComplete="given-name" {...register('name')} />
          </FormField>
          <FormField label="Last name" required error={errors.surname?.message}>
            <Input placeholder="Stone" autoComplete="family-name" {...register('surname')} />
          </FormField>
        </div>

        <FormField label="Email" required error={errors.email?.message}>
          <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
        </FormField>

        <FormField label="Phone" required hint="International format, e.g. +7 700 111 22 33" error={errors.phone?.message}>
          <Input type="tel" placeholder="+7 700 ..." autoComplete="tel" {...register('phone')} />
        </FormField>

        <FormField label="Date of birth" required error={errors.birth_date?.message}>
          <Input type="date" {...register('birth_date')} />
        </FormField>

        <FormField label="Password" required hint="Min 6 chars, at least one number" error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </FormField>

        <FormField label="Confirm password" required error={errors.confirm?.message}>
          <Input type="password" autoComplete="new-password" {...register('confirm')} />
        </FormField>

        {serverError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        Already a member?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
