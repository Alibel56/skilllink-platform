import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
import { orders } from '@/lib/api';
import { categoryLabel } from '@/lib/constants';
import { formatPrice, formatRelative, shortId } from '@/lib/utils';

export default function JobsPage() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ['orders', 'active'],
    queryFn: () => orders.active(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Open jobs"
        description="Active orders posted by clients. Take one to start working."
      />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-24" /></Card>
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={Briefcase} title="No open jobs right now" description="Check back soon — clients post work all day." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((o) => (
            <Card key={o.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="font-semibold">{categoryLabel(o.job_type)}</h3>
                  <p className="text-xs text-muted-foreground">#{shortId(o.id)} · {formatRelative(o.created_at)}</p>
                </div>
                <OrderStatusBadge status={o.status} />
              </div>
              {o.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{o.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between pt-3 border-t">
                <span className="text-lg font-semibold tabular-nums">{formatPrice(o.price)}</span>
                <Button size="sm" onClick={() => navigate(`/orders/${o.id}`)}>View & take</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
