import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { orders } from '@/lib/api';
import { categoryLabel } from '@/lib/constants';
import { formatPrice, formatRelative, shortId } from '@/lib/utils';
import { useAuth } from '@/lib/auth-store';
import type { OrderDto } from '@/types/api';

export default function OrdersListPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const isSpecialist = user?.role === 'specialist';

  const myOrders = useQuery<OrderDto[]>({
    queryKey: ['orders', 'my'],
    queryFn: () => orders.my(),
    enabled: !!token,
  });

  // Active = my orders that are still 'open' or 'in_progress'. We derive it
  // from the same /orders/my response instead of /orders/active because that
  // endpoint is specialist-only (returns open jobs to take).
  const myList: OrderDto[] = Array.isArray(myOrders.data) ? myOrders.data : [];
  const activeList = myList.filter(
    (o) => o.status === 'open' || o.status === 'in_progress',
  );
  const activeOrders = {
    data: activeList,
    isLoading: myOrders.isLoading,
  };

  const specialistOrders = useQuery<OrderDto[]>({
    queryKey: ['orders', 'specialist', 'my'],
    queryFn: () => orders.specialistMy(),
    enabled: !!token && isSpecialist,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My orders"
        description={isSpecialist ? 'Orders you posted as a client and orders you took as a specialist.' : 'Orders you have posted.'}
        actions={
          <Button onClick={() => navigate('/orders/new')}>
            <Plus className="h-4 w-4" /> New order
          </Button>
        }
      />

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My orders</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          {isSpecialist && <TabsTrigger value="taken">Jobs I took</TabsTrigger>}
        </TabsList>

        <TabsContent value="my">
          <OrdersGrid query={myOrders} emptyTitle="No orders yet" onNew={() => navigate('/orders/new')} />
        </TabsContent>
        <TabsContent value="active">
          <OrdersGrid query={activeOrders} emptyTitle="No active orders" onNew={() => navigate('/orders/new')} />
        </TabsContent>
        {isSpecialist && (
          <TabsContent value="taken">
            <OrdersGrid query={specialistOrders} emptyTitle="No jobs taken yet" />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function OrdersGrid({ query, emptyTitle, onNew }: { query: { data?: OrderDto[]; isLoading: boolean }; emptyTitle: string; onNew?: () => void }) {
  if (query.isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5"><Skeleton className="h-20 w-full" /></Card>
        ))}
      </div>
    );
  }
  const data = query.data ?? [];
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title={emptyTitle}
        description="When you post or take a job, it will appear here."
        action={onNew ? <Button onClick={onNew}>Post a job</Button> : undefined}
      />
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {data.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: OrderDto }) {
  return (
    <Link to={`/orders/${order.id}`} className="group block">
      <Card className="p-5 transition-all group-hover:shadow-elevated group-hover:border-primary/30">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold truncate">{categoryLabel(order.job_type)}</h3>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatRelative(order.created_at)}
              </span>
              <span className="mx-1.5">·</span>
              #{shortId(order.id)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        {order.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2 text-pretty">{order.description}</p>
        )}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <span className="text-lg font-semibold tabular-nums">{formatPrice(order.price)}</span>
          <span className="text-xs font-medium text-primary">Open →</span>
        </div>
      </Card>
    </Link>
  );
}
