import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LocateFixed, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { specialists } from '@/lib/api';
import { SPECIALIST_ID_KEY } from '@/lib/auth-store';
import { DEFAULT_LAT, DEFAULT_LON, getGPS } from '@/lib/utils';

export default function BecomeSpecialistPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lon, setLon] = useState(DEFAULT_LON);
  const [locating, setLocating] = useState(false);

  const create = useMutation({
    mutationFn: () => specialists.create({ lat, lon }),
    onSuccess: (s) => {
      localStorage.setItem(SPECIALIST_ID_KEY, s.id);
      qc.invalidateQueries({ queryKey: ['users', 'profile'] });
      qc.invalidateQueries({ queryKey: ['catalog'] });
      toast.success('You are now a specialist!');
      navigate('/catalog');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function locate() {
    setLocating(true);
    const c = await getGPS(5000);
    setLat(c.lat); setLon(c.lon);
    setLocating(false);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Become a specialist" description="List your services and start receiving job requests." />

      <Card className="p-6 sm:p-8 gradient-mesh space-y-4">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Tell us where you work</h2>
          <p className="text-sm text-muted-foreground">
            We'll geo-index your service area so nearby clients can find you.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Latitude" required>
            <Input type="number" step="any" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
          </FormField>
          <FormField label="Longitude" required>
            <Input type="number" step="any" value={lon} onChange={(e) => setLon(Number(e.target.value))} />
          </FormField>
          <FormField label=" ">
            <Button type="button" variant="outline" className="w-full" onClick={locate} loading={locating}>
              <LocateFixed className="h-4 w-4" /> GPS
            </Button>
          </FormField>
        </div>
        <Button onClick={() => create.mutate()} loading={create.isPending} className="w-full" size="lg">
          Register as specialist
        </Button>
      </Card>
    </div>
  );
}
