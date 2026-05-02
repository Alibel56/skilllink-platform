import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Activity, BadgeCheck, Power, ShieldCheck, RefreshCw, PowerOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { admin, files, specialists } from '@/lib/api';
import { formatRelative, shortId } from '@/lib/utils';
import type { SpecialistDto } from '@/types/api';

export default function AdminPage() {
  const qc = useQueryClient();

  const list = useQuery<SpecialistDto[]>({
    queryKey: ['admin', 'specialists', 'list'],
    queryFn: () => specialists.list(200, 0),
  });

  const profiling = useQuery({
    queryKey: ['admin', 'profiling'],
    queryFn: () => admin.profiling(),
    retry: false,
    enabled: false, // тянем по кнопке Refresh
  });

  const verify = useMutation({
    mutationFn: (id: string) => specialists.verify(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'specialists'] });
      toast.success('Specialist verified');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => specialists.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'specialists'] });
      toast.success('Specialist deactivated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activate = useMutation({
    mutationFn: (id: string) => specialists.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'specialists'] });
      toast.success('Specialist activated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = Array.isArray(list.data) ? list.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin panel"
        description="Verify specialists, deactivate misbehaving accounts, observe system performance."
        actions={
          <Button
            variant="outline"
            onClick={() => qc.invalidateQueries({ queryKey: ['admin', 'specialists'] })}
            loading={list.isFetching}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <Tabs defaultValue="specialists">
        <TabsList>
          <TabsTrigger value="specialists">Specialists ({items.length})</TabsTrigger>
          <TabsTrigger value="profiling">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="specialists" className="space-y-3">
          {list.isLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-5"><Skeleton className="h-20 w-full" /></Card>
              ))}
            </div>
          ) : list.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {(list.error as Error).message}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No specialists yet"
              description="Once users register as specialists, they'll show up here for verification."
            />
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {items.map((sp) => (
                <li key={sp.id}>
                  <Card className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={files.avatarUrl(sp.user_id)} alt="" />
                        <AvatarFallback>
                          {(sp.name?.[0] ?? '') + (sp.surname?.[0] ?? '') ||
                            shortId(sp.user_id, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="font-semibold truncate">
                          {sp.name || sp.surname
                            ? `${sp.name ?? ''} ${sp.surname ?? ''}`.trim()
                            : `Specialist ${shortId(sp.id)}`}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {sp.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatRelative(sp.created_at)} · h3 {sp.h3_index.slice(0, 8)}…
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {sp.is_verified ? (
                        <Badge variant="default" className="gap-1">
                          <BadgeCheck className="h-3.5 w-3.5" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="muted">Not verified</Badge>
                      )}
                      {sp.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </div>

                    <div className="pt-3 border-t flex flex-wrap gap-2">
                      {!sp.is_verified && (
                        <Button
                          size="sm"
                          onClick={() => verify.mutate(sp.id)}
                          loading={verify.isPending && verify.variables === sp.id}
                        >
                          <BadgeCheck className="h-3.5 w-3.5" /> Verify
                        </Button>
                      )}
                      {sp.is_active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/40 hover:bg-destructive/10"
                          onClick={() => deactivate.mutate(sp.id)}
                          loading={deactivate.isPending && deactivate.variables === sp.id}
                        >
                          <PowerOff className="h-3.5 w-3.5" /> Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activate.mutate(sp.id)}
                          loading={activate.isPending && activate.variables === sp.id}
                        >
                          <Power className="h-3.5 w-3.5" /> Activate
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="profiling">
          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Latency report</h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => profiling.refetch()} loading={profiling.isFetching}>
                <RefreshCw className="h-4 w-4" /> Fetch
              </Button>
            </div>
            {profiling.error ? (
              <p className="text-sm text-destructive">{(profiling.error as Error).message}</p>
            ) : (
              <pre className="text-xs bg-muted rounded-md p-4 overflow-auto max-h-[500px]">
                {profiling.data ? JSON.stringify(profiling.data, null, 2) : 'Press Fetch to load.'}
              </pre>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
