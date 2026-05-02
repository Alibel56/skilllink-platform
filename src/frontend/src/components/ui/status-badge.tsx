import type { OrderStatus, RequestStatus } from '@/types/api';
import { Badge } from './badge';
import { ORDER_STATUS_LABEL, REQUEST_STATUS_LABEL } from '@/lib/constants';

const orderVariant: Record<OrderStatus, React.ComponentProps<typeof Badge>['variant']> = {
  open: 'default',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'destructive',
};

const requestVariant: Record<RequestStatus, React.ComponentProps<typeof Badge>['variant']> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'destructive',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={orderVariant[status]}>{ORDER_STATUS_LABEL[status] ?? status}</Badge>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={requestVariant[status]}>{REQUEST_STATUS_LABEL[status] ?? status}</Badge>;
}
