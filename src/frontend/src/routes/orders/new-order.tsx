import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/constants';
import { orders } from '@/lib/api';

const schema = z.object({
  job_type: z.string().min(1, 'Select a service'),
  description: z.string().max(2000).optional().or(z.literal('')),
  price: z.coerce.number().positive('Price must be positive'),
  specialist_id: z.string().uuid().optional().or(z.literal('')),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function NewOrderPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [serverError, setServerError] = useState('');
  const presetSpecialist = params.get('specialist_id') ?? '';
  const presetJob = params.get('job_type') ?? '';
  const presetPrice = params.get('price') ?? '';

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormInput, unknown, FormOutput>({
      resolver: zodResolver(schema),
      defaultValues: {
        job_type: presetJob,
        description: '',
        price: presetPrice ? presetPrice : '',
        specialist_id: presetSpecialist,
      },
    });

  async function onSubmit(values: FormOutput) {
    setServerError('');
    try {
      const created = await orders.create({
        job_type: values.job_type,
        description: values.description || null,
        price: values.price,
        specialist_id: values.specialist_id || null,
      });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order posted');
      navigate(`/orders/${created.id}`);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Could not post order');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Post a new order" description="Describe what you need — specialists will respond." />

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Service" required error={errors.job_type?.message}>
            <Select
              value={watch('job_type')}
              onValueChange={(v) => setValue('job_type', v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a service" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Budget (price)" required error={errors.price?.message} hint="What you're willing to pay">
            <Input type="number" min={1} step="any" placeholder="5000" {...register('price')} />
          </FormField>

          <FormField label="Description" hint="Optional — share details, location, timing" error={errors.description?.message}>
            <Textarea rows={5} placeholder="Describe the work you need…" {...register('description')} />
          </FormField>

          {presetSpecialist && (
            <FormField label="Direct order to specialist" hint="Locked — coming from specialist profile">
              <Input value={presetSpecialist} readOnly className="font-mono text-xs" />
            </FormField>
          )}

          {serverError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Post order</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
