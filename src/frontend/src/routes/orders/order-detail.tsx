import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Send, Trash2, CheckCheck, X, PlayCircle, Edit, Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { OrderStatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { orders, messages } from '@/lib/api';
import { categoryLabel } from '@/lib/constants';
import { SPECIALIST_ID_KEY, useAuth } from '@/lib/auth-store';
import { formatDateTime, formatPrice, formatRelative, shortId } from '@/lib/utils';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id ?? '';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orders.get(orderId),
    enabled: !!orderId,
  });

  const mySpecialistId = typeof window !== 'undefined'
    ? localStorage.getItem(SPECIALIST_ID_KEY)
    : null;
  const isOwner = user?.id === order?.user_id;
  const isAssignedSpecialist =
    !!order?.specialist_id &&
    user?.role === 'specialist' &&
    !!mySpecialistId &&
    order.specialist_id === mySpecialistId;

  const take = useMutation({
    mutationFn: () => orders.take(orderId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order taken'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const complete = useMutation({
    mutationFn: () => orders.complete(orderId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order completed'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: () => orders.cancel(orderId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order cancelled'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => orders.delete(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted');
      navigate('/orders');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }
  if (!order) {
    return <EmptyState title="Order not found" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={categoryLabel(order.job_type)}
        description={`Order #${shortId(order.id)} · created ${formatRelative(order.created_at)}`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Price</dt>
                <dd className="font-semibold text-base mt-1">{formatPrice(order.price)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Service</dt>
                <dd className="font-medium mt-1">{categoryLabel(order.job_type)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Specialist</dt>
                <dd className="font-medium mt-1">{order.specialist_id ? shortId(order.specialist_id) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Created</dt>
                <dd className="font-medium mt-1">{formatDateTime(order.created_at)}</dd>
              </div>
            </dl>
            {order.description && (
              <>
                <hr className="my-5" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Description</div>
                  <p className="text-sm text-pretty whitespace-pre-wrap">{order.description}</p>
                </div>
              </>
            )}
          </Card>

          <Tabs defaultValue="chat">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              {isOwner && <TabsTrigger value="edit">Edit</TabsTrigger>}
            </TabsList>
            <TabsContent value="chat">
              <ChatPanel orderId={orderId} />
            </TabsContent>
            {isOwner && (
              <TabsContent value="edit">
                <EditOrderPanel order={order} />
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="space-y-3">
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">Actions</h3>
            <div className="flex flex-col gap-2">
              {order.status === 'open' && user?.role === 'specialist' && !isOwner && (
                <Button onClick={() => take.mutate()} loading={take.isPending}>
                  <PlayCircle className="h-4 w-4" /> Take this job
                </Button>
              )}
              {(isOwner || isAssignedSpecialist) && order.status === 'in_progress' && (
                <Button onClick={() => complete.mutate()} variant="success" loading={complete.isPending}>
                  <CheckCheck className="h-4 w-4" /> Mark completed
                </Button>
              )}
              {(isOwner || isAssignedSpecialist) && (order.status === 'open' || order.status === 'in_progress') && (
                <Button onClick={() => cancel.mutate()} variant="outline" loading={cancel.isPending}>
                  <X className="h-4 w-4" /> Cancel order
                </Button>
              )}
              {isOwner && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" /> Delete order
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete this order?</DialogTitle>
                      <DialogDescription>This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="destructive" onClick={() => remove.mutate()} loading={remove.isPending}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </Card>

          <Card className="p-5 space-y-2 text-xs">
            <h3 className="font-semibold text-sm">Order timeline</h3>
            <div className="space-y-1.5 text-muted-foreground">
              <div>Created: {formatDateTime(order.created_at)}</div>
              {order.completed_at && <div>Completed: {formatDateTime(order.completed_at)}</div>}
              <div>Active: {order.is_active ? 'Yes' : 'No'}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ orderId }: { orderId: string }) {
  const [text, setText] = useState('');
  const qc = useQueryClient();
  const { user } = useAuth();
  const endRef = useRef<HTMLDivElement>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ['chat', orderId],
    queryFn: () => messages.chat(orderId),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.length]);

  const send = useMutation({
    mutationFn: (m: string) => messages.write(orderId, { message: m }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat', orderId] }); setText(''); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="flex flex-col h-[480px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground my-auto">
            No messages yet. Say hi 👋
          </div>
        ) : (
          data.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{shortId(m.sender_id, 2).toUpperCase()}</AvatarFallback></Avatar>}
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="whitespace-pre-wrap text-pretty">{m.message}</p>
                  <p className={`text-[10px] mt-0.5 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatRelative(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form
        className="border-t p-3 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(text.trim()); }}
      >
        <Textarea
          rows={1}
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) send.mutate(text.trim());
            }
          }}
          className="min-h-0 flex-1"
        />
        <Button type="submit" disabled={!text.trim()} loading={send.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}

function EditOrderPanel({ order }: { order: import('@/types/api').OrderDto }) {
  const qc = useQueryClient();
  const [jobType, setJobType] = useState(order.job_type);
  const [description, setDescription] = useState(order.description ?? '');
  const [price, setPrice] = useState(String(order.price));

  const priceNum = Number(price);
  const priceInvalid = !Number.isFinite(priceNum) || priceNum <= 0;
  const canSubmit = !!jobType.trim() && !priceInvalid;

  const update = useMutation({
    mutationFn: () => orders.update(order.id, {
      job_type: jobType,
      description: description || null,
      price: priceNum,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders', order.id] }); toast.success('Order updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-5 space-y-4">
      <FormField label="Service" required>
        <Input value={jobType} onChange={(e) => setJobType(e.target.value)} />
      </FormField>
      <FormField
        label="Price"
        required
        error={price && priceInvalid ? 'Price must be a positive number' : undefined}
      >
        <Input type="number" min={1} step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
      </FormField>
      <FormField label="Description"><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></FormField>
      <Button onClick={() => update.mutate()} loading={update.isPending} disabled={!canSubmit}>
        <Edit className="h-4 w-4" /> Save changes
      </Button>
    </Card>
  );
}
