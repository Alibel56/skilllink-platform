import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { BadgeCheck, MapPin, Calendar, Trash2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Stars } from '@/components/ui/stars';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { specialists, catalog as catalogApi, comments, rates, files } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { formatPrice, formatRelative, shortId } from '@/lib/utils';
import type { CatalogDto, CommentDto, RateDto } from '@/types/api';

const commentSchema = z.object({ comment: z.string().min(1, 'Write something').max(1000) });

export default function SpecialistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const specialistId = id ?? '';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [myRate, setMyRate] = useState(0);

  const { data: specialist, isLoading } = useQuery({
    queryKey: ['specialists', specialistId],
    queryFn: () => specialists.get(specialistId),
    enabled: !!specialistId,
  });

  const { data: itemsRaw } = useQuery<CatalogDto[]>({
    queryKey: ['catalog', specialistId],
    queryFn: () => catalogApi.get(specialistId),
    enabled: !!specialistId,
  });
  const items: CatalogDto[] = Array.isArray(itemsRaw) ? itemsRaw : [];

  const { data: commentsRaw } = useQuery<CommentDto[]>({
    queryKey: ['comments', specialistId],
    queryFn: () => comments.list(specialistId),
    enabled: !!specialistId,
  });
  const commentsData: CommentDto[] = Array.isArray(commentsRaw) ? commentsRaw : [];

  const { data: ratesRaw } = useQuery<RateDto[]>({
    queryKey: ['rates', specialistId],
    queryFn: () => rates.list(specialistId),
    enabled: !!specialistId,
  });
  // Guard against backends that return {message: ...} instead of an array —
  // before this guard a single bad response crashed the whole React tree
  // (`ratesData.reduce is not a function` -> white screen).
  const ratesData: RateDto[] = Array.isArray(ratesRaw) ? ratesRaw : [];

  const avgRate =
    ratesData.length > 0
      ? ratesData.reduce((acc, r) => acc + r.rate, 0) / ratesData.length
      : 0;

  useEffect(() => {
    if (!user) return;
    const mine = ratesData.find((r) => r.user_id === user.id);
    setMyRate(mine?.rate ?? 0);
  }, [ratesData, user]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<{ comment: string }>({ resolver: zodResolver(commentSchema) });

  const writeComment = useMutation({
    mutationFn: (text: string) => comments.write(specialistId, { comment: text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', specialistId] });
      reset();
      toast.success('Review posted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitRate = useMutation({
    mutationFn: (val: number) => rates.create(specialistId, { rate: val }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rates', specialistId] });
      toast.success('Rating saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRate = useMutation({
    mutationFn: () => rates.delete(specialistId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rates', specialistId] });
      setMyRate(0);
      toast.success('Rating removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }
  if (!specialist) {
    return <EmptyState title="Specialist not found" />;
  }

  const isMine = user?.id === specialist.user_id;

  function bookSpecialist(item?: { job_type: string; price: number }) {
    const params = new URLSearchParams();
    params.set('specialist_id', specialistId);
    if (item) {
      params.set('job_type', item.job_type);
      params.set('price', String(item.price));
    }
    navigate(`/orders/new?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8 gradient-mesh">
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={files.avatarUrl(specialist.user_id)} alt="" />
            <AvatarFallback className="text-2xl">{shortId(specialist.user_id, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold">Specialist {shortId(specialist.id)}</h1>
                {specialist.is_verified && (
                  <Badge variant="default" className="gap-1"><BadgeCheck className="h-3.5 w-3.5" />Verified</Badge>
                )}
                {specialist.is_active ? (
                  <Badge variant="success">Available</Badge>
                ) : (
                  <Badge variant="muted">Unavailable</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {formatRelative(specialist.created_at)}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {specialist.h3_index.slice(0, 8)}…</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Stars value={avgRate} size={18} />
              <span className="text-sm font-medium">{avgRate.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({ratesData.length} ratings)</span>
            </div>
            {!isMine && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button onClick={() => bookSpecialist()}>Book this specialist</Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services ({items.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({commentsData.length})</TabsTrigger>
          <TabsTrigger value="rate">Rate</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-3">
          {items.length === 0 ? (
            <EmptyState title="No services yet" description="This specialist hasn't published a catalog." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((it) => (
                <Card key={it.id} className="p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{it.job_type}</h3>
                    <p className="text-xs text-muted-foreground">Added {formatRelative(it.created_at)}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-lg font-semibold tabular-nums">{formatPrice(it.price)}</span>
                    {!isMine && (
                      <Button size="sm" onClick={() => bookSpecialist(it)}>Book</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {!isMine && (
            <Card className="p-5">
              <form
                onSubmit={handleSubmit((v) => writeComment.mutate(v.comment))}
                className="space-y-3"
              >
                <FormField label="Leave a review" error={errors.comment?.message}>
                  <Textarea
                    placeholder="Share your experience…"
                    rows={3}
                    {...register('comment')}
                  />
                </FormField>
                <div className="flex justify-end">
                  <Button type="submit" loading={isSubmitting || writeComment.isPending}>
                    <Send className="h-4 w-4" /> Post review
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {commentsData.length === 0 ? (
            <EmptyState title="No reviews yet" description="Be the first to share a thought about this specialist." />
          ) : (
            <ul className="space-y-3">
              {commentsData.map((c) => (
                <Card key={c.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9"><AvatarFallback>{shortId(c.user_id, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">Client {shortId(c.user_id)}</span>
                        <span className="text-xs text-muted-foreground">{formatRelative(c.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm text-pretty">{c.comment}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="rate" className="space-y-4">
          {isMine ? (
            <EmptyState title="You can't rate yourself" />
          ) : (
            <Card className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold">Rate this specialist</h3>
                <p className="text-sm text-muted-foreground">Your rating helps other clients pick the right pro.</p>
              </div>
              <Stars value={myRate} size={28} onChange={setMyRate} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => myRate > 0 && submitRate.mutate(myRate)} disabled={!myRate} loading={submitRate.isPending}>
                  Submit rating
                </Button>
                <Button variant="outline" onClick={() => deleteRate.mutate()} loading={deleteRate.isPending}>
                  <Trash2 className="h-4 w-4" /> Remove my rating
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}
