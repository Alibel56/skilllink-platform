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

const schema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8).startsWith('+'),
  birth_date: z.string().min(1),
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
    mutationFn: (data: FormValues) => users.update(data),
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
        <form onSubmit={handleSubmit((v) => update.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="First name" required error={errors.name?.message}>
              <Input {...register('name')} />
            </FormField>
            <FormField label="Last name" required error={errors.surname?.message}>
              <Input {...register('surname')} />
            </FormField>
          </div>
          <FormField label="Email" required error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </FormField>
          <FormField label="Phone" required error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} />
          </FormField>
          <FormField label="Date of birth" required error={errors.birth_date?.message}>
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
