import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileBadge, Upload, Trash2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ApiError, files, specialists } from '@/lib/api';
import { SPECIALIST_ID_KEY } from '@/lib/auth-store';

export default function AccreditationPage() {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const specialistId = typeof window !== 'undefined' ? localStorage.getItem(SPECIALIST_ID_KEY) : null;

  const { data: doc, error, isLoading } = useQuery({
    queryKey: ['accreditation'],
    queryFn: () => files.getAccreditation(),
    retry: false,
  });

  const upload = useMutation({
    mutationFn: (file: File) => files.uploadAccreditation(file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accreditation'] }); toast.success('Document uploaded'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => files.deleteAccreditation(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accreditation'] }); toast.success('Removed'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => specialists.deactivate(id),
    onSuccess: () => toast.success('Profile deactivated'),
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSpecialist = useMutation({
    mutationFn: () => specialists.delete(),
    onSuccess: () => {
      localStorage.removeItem(SPECIALIST_ID_KEY);
      qc.invalidateQueries({ queryKey: ['users', 'profile'] });
      toast.success('Specialist profile deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isMissingDoc = !doc || (error instanceof ApiError && error.status === 404);
  const isOtherError = error && !(error instanceof ApiError && error.status === 404);

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Accreditation"
        description="Upload a certificate or license to verify your skills."
      />

      {!specialistId ? (
        <EmptyState
          icon={FileBadge}
          title="Specialist profile required"
          description="Become a specialist before uploading accreditation documents."
        />
      ) : (
        <>
          <Card className="p-6 space-y-4">
            {isOtherError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {(error as Error).message}
              </div>
            ) : null}

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : isMissingDoc ? (
              <div className="space-y-3">
                <h3 className="font-semibold">No document uploaded</h3>
                <p className="text-sm text-muted-foreground">Add a certificate (PDF, JPEG, or PNG).</p>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload.mutate(f);
                  }}
                />
                <Button onClick={() => fileInput.current?.click()} loading={upload.isPending}>
                  <Upload className="h-4 w-4" /> Upload document
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold">Document uploaded</h3>
                <p className="text-sm text-muted-foreground">Your accreditation is on file.</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => fileInput.current?.click()}>
                    <Upload className="h-4 w-4" /> Replace
                  </Button>
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove.mutate()} loading={remove.isPending}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload.mutate(f);
                  }}
                />
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold">Manage specialist profile</h3>
              <p className="text-sm text-muted-foreground">Deactivate so clients can't book you, or delete the profile entirely.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => deactivate.mutate(specialistId)} loading={deactivate.isPending}>
                <Power className="h-4 w-4" /> Deactivate
              </Button>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeSpecialist.mutate()} loading={removeSpecialist.isPending}>
                <Trash2 className="h-4 w-4" /> Delete specialist profile
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
