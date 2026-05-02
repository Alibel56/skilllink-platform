import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { users } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

// Все поля опциональные — это PATCH-стиль апдейт. Пользователь меняет только
// нужное; пустые значения не уходят на бэк. Типы валидации применяются
// только когда поле заполнено.
const schema = z.object({
  name: z.string().trim().min(1, 'Cannot be empty').optional().or(z.literal('')),
  surname: z.string().trim().min(1, 'Cannot be empty').optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string()
    .min(8, 'Min 8 digits with country code')
    .startsWith('+', 'Phone must start with +')
    .optional()
    .or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export default function EditProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { signOut } = useAuth();
  const [serverError, setServerError] = useState('');

  const { data: profile, isLoading } = useQuery({ queryKey: ['users', 'profile'], queryFn: users.profile });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: profile ? {
      name: profile.name,
      surname: profile.surname,
      email: profile.email,
      phone: profile.phone,
      birth_date: profile.birth_date,
    } : undefined,
  });

  const update = useMutation({
    mutationFn: (data: FormValues) => {
      // Слать только заполненные поля — бэк UserUpdate всё равно опциональный.
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => typeof v === 'string' && v.trim() !== ''),
      );
      return users.update(payload);
    },
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      reset({ name: u.name, surname: u.surname, email: u.email, phone: u.phone, birth_date: u.birth_date });
      toast.success('Profile updated');
    },
    onError: (e: Error) => setServerError(e.message),
  });

  const remove = useMutation({
    mutationFn: () => users.delete(),
    onSuccess: () => { signOut(); toast.success('Account deleted'); navigate('/login'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Edit profile" description="Update your personal info." />

      <Card className="p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Leave a field blank to keep its current value.
        </p>
        <form onSubmit={handleSubmit((v) => update.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="First name" error={errors.name?.message}>
              <Input {...register('name')} />
            </FormField>
            <FormField label="Last name" error={errors.surname?.message}>
              <Input {...register('surname')} />
            </FormField>
          </div>
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </FormField>
          <FormField label="Phone" error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} />
          </FormField>
          <FormField label="Date of birth" error={errors.birth_date?.message}>
            <Input type="date" {...register('birth_date')} />
          </FormField>

          {serverError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{serverError}</div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || update.isPending}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 border-destructive/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Delete account</h3>
            <p className="text-sm text-muted-foreground">Permanently remove your account and all related data.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Delete account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete account?</DialogTitle>
                <DialogDescription>This is permanent. Your orders, ratings, and profile will be removed.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={() => remove.mutate()} loading={remove.isPending}>Yes, delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
}
