import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestStatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
import { requests } from '@/lib/api';
import { formatRelative, shortId } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function RequestsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ['requests', 'all'],
    queryFn: () => requests.all(),
  });

  const approve = useMutation({
    mutationFn: (id: string) => requests.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['requests'] }); toast.success('Approved'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Order requests" description="Direct requests sent to you by clients." />
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-5"><Skeleton className="h-20" /></Card>)}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={Inbox} title="No requests yet" description="When a client sends a direct request, it shows up here." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.map((r) => (
            <Card key={r.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="font-semibold">Request #{shortId(r.id)}</h3>
                  <p className="text-xs text-muted-foreground">{formatRelative(r.created_at)}</p>
                </div>
                <RequestStatusBadge status={r.status} />
              </div>
              <dl className="text-xs text-muted-foreground space-y-0.5">
                <div>Order: <span className="font-mono">{shortId(r.order_id)}</span></div>
                <div>Client: <span className="font-mono">{shortId(r.user_id)}</span></div>
              </dl>
              <div className="pt-3 border-t flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/orders/${r.order_id}`)}>View order</Button>
                {r.status === 'pending' && (
                  <Button size="sm" onClick={() => approve.mutate(r.id)} loading={approve.isPending}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
