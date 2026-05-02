import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { admin, specialists } from '@/lib/api';

export default function AdminPage() {
  const qc = useQueryClient();
  const [verifyId, setVerifyId] = useState('');

  const profiling = useQuery({
    queryKey: ['admin', 'profiling'],
    queryFn: () => admin.profiling(),
    retry: false,
  });

  const verify = useMutation({
    mutationFn: (id: string) => specialists.verify(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['specialists'] }); toast.success('Specialist verified'); setVerifyId(''); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin panel"
        description="Verify specialists and observe system performance."
        actions={<Button variant="outline" onClick={() => profiling.refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />

      <Tabs defaultValue="verify">
        <TabsList>
          <TabsTrigger value="verify">Verify specialists</TabsTrigger>
          <TabsTrigger value="profiling">Performance profiling</TabsTrigger>
        </TabsList>

        <TabsContent value="verify">
          <Card className="p-6 space-y-4 max-w-xl">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-success/10 text-success">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <FormField label="Specialist UUID" hint="Paste the specialist ID to verify">
              <Input value={verifyId} onChange={(e) => setVerifyId(e.target.value)} placeholder="00000000-0000-…" className="font-mono" />
            </FormField>
            <Button onClick={() => verify.mutate(verifyId)} loading={verify.isPending} disabled={!verifyId}>
              Verify specialist
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="profiling">
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Latency report</h3>
            </div>
            {profiling.error ? (
              <p className="text-sm text-destructive">{(profiling.error as Error).message}</p>
            ) : (
              <pre className="text-xs bg-muted rounded-md p-4 overflow-auto max-h-[500px]">
                {JSON.stringify(profiling.data ?? '', null, 2)}
              </pre>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
