import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
import { orders } from '@/lib/api';
import { categoryLabel } from '@/lib/constants';
import { formatPrice, formatRelative, shortId } from '@/lib/utils';

export default function MyJobsPage() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ['orders', 'specialist', 'my'],
    queryFn: () => orders.specialistMy(),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My jobs" description="Orders you took as a specialist." />
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-24" /></Card>
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={Calendar} title="You haven't taken any jobs yet" description="Browse open jobs and start earning." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.map((o) => (
            <button key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className="text-left">
              <Card className="p-5 transition-all hover:shadow-elevated hover:border-primary/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{categoryLabel(o.job_type)}</h3>
                    <p className="text-xs text-muted-foreground">#{shortId(o.id)} · {formatRelative(o.created_at)}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                  <span className="text-lg font-semibold tabular-nums">{formatPrice(o.price)}</span>
                  <span className="text-xs font-medium text-primary">Open →</span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
