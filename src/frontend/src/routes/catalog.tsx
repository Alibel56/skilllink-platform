import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { catalog as catalogApi } from '@/lib/api';
import { useMySpecialistId } from '@/lib/use-specialist';
import { CATEGORIES, categoryLabel } from '@/lib/constants';
import { formatPrice, formatRelative } from '@/lib/utils';
import type { CatalogDto } from '@/types/api';

export default function CatalogPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<CatalogDto | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const specialistId = useMySpecialistId();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['catalog', specialistId],
    queryFn: () => catalogApi.get(specialistId!),
    enabled: !!specialistId,
  });

  const add = useMutation({
    mutationFn: (data: { job_type: string; price: number }) => catalogApi.add(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog'] });
      setShowAdd(false);
      setDialogError('');
      toast.success('Service added');
    },
    onError: (e: Error) => setDialogError(e.message),
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string; job_type?: string; price?: number }) =>
      catalogApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog'] });
      setEditing(null);
      setDialogError('');
      toast.success('Saved');
    },
    onError: (e: Error) => setDialogError(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => catalogApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalog'] }); toast.success('Removed'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!specialistId) {
    return (
      <div className="space-y-6">
        <PageHeader title="My catalog" description="Manage the services you offer." />
        <EmptyState
          icon={Layers}
          title="Become a specialist first"
          description="To publish a catalog, you need to register as a specialist."
          action={<Button onClick={() => navigate('/profile/become-specialist')}>Become a specialist</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My catalog"
        description={`Services you offer · Specialist ${specialistId.slice(0, 8)}…`}
        actions={<Button onClick={() => { setShowAdd(true); setDialogError(''); }}><Plus className="h-4 w-4" /> Add service</Button>}
      />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-5"><Skeleton className="h-20" /></Card>)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Layers} title="No services yet" description="Add your first service so clients can find you." action={<Button onClick={() => { setShowAdd(true); setDialogError(''); }}>Add service</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => (
            <Card key={it.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{categoryLabel(it.job_type)}</h3>
                  <p className="text-xs text-muted-foreground">{formatRelative(it.created_at)}</p>
                </div>
                <span className="text-base font-semibold tabular-nums">{formatPrice(it.price)}</span>
              </div>
              <div className="pt-3 border-t flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(it); setDialogError(''); }}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove.mutate(it.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) setDialogError(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add service</DialogTitle>
            <DialogDescription>Pick a category and set your price.</DialogDescription>
          </DialogHeader>
          <CatalogForm
            onSubmit={(v) => add.mutate(v)}
            submitting={add.isPending}
            submitLabel="Add"
            serverError={dialogError}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setDialogError(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
          </DialogHeader>
          {editing && (
            <CatalogForm
              initial={{ job_type: editing.job_type, price: editing.price }}
              onSubmit={(v) => update.mutate({ id: editing.id, ...v })}
              submitting={update.isPending}
              submitLabel="Save"
              serverError={dialogError}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CatalogForm({
  initial,
  onSubmit,
  submitting,
  submitLabel,
  serverError,
}: {
  initial?: { job_type: string; price: number };
  onSubmit: (v: { job_type: string; price: number }) => void;
  submitting: boolean;
  submitLabel: string;
  serverError?: string;
}) {
  const [jobType, setJobType] = useState(initial?.job_type ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const priceNum = Number(price);
  const priceInvalid = !Number.isFinite(priceNum) || priceNum <= 0;
  const canSubmit = !!jobType && !priceInvalid;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ job_type: jobType, price: priceNum });
      }}
      className="space-y-4"
    >
      <FormField label="Service" required>
        <Select value={jobType} onValueChange={setJobType}>
          <SelectTrigger><SelectValue placeholder="Pick a service" /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        label="Price"
        required
        error={price && priceInvalid ? 'Must be a positive number' : undefined}
      >
        <Input type="number" min={1} step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
      </FormField>
      {serverError && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}
      <DialogFooter>
        <Button type="submit" loading={submitting} disabled={!canSubmit}>{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}
