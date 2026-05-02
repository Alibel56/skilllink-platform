import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MapPin, Trash2, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { address as addressApi } from '@/lib/api';
import { DEFAULT_LAT, DEFAULT_LON, getGPS } from '@/lib/utils';

export default function AddressPage() {
  const qc = useQueryClient();
  const { data: addr } = useQuery({ queryKey: ['address'], queryFn: addressApi.get, retry: false });

  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [lon, setLon] = useState<number>(DEFAULT_LON);
  const [locating, setLocating] = useState(false);

  const coordsValid =
    Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    Number.isFinite(lon) && lon >= -180 && lon <= 180;
  const canSave = !!country.trim() && !!city.trim() && !!street.trim() && coordsValid;

  useEffect(() => {
    if (addr) {
      setCountry(addr.country);
      setCity(addr.city);
      setStreet(addr.street);
    }
  }, [addr]);

  const save = useMutation({
    mutationFn: () => addressApi.add({ country, city, street, lat, lon }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['address'] }); toast.success('Address saved'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => addressApi.delete(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['address'] }); toast.success('Address removed'); },
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
      <PageHeader title="Address" description="Used to match you with nearby specialists (H3 spatial index)." />

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Country" required>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Kazakhstan" />
          </FormField>
          <FormField label="City" required>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Aktobe" />
          </FormField>
        </div>
        <FormField label="Street" required>
          <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Abilkair khan ave 200" />
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField
            label="Latitude"
            required
            error={Number.isFinite(lat) && (lat < -90 || lat > 90) ? '−90…90' : undefined}
          >
            <Input
              type="number"
              step="any"
              value={Number.isFinite(lat) ? lat : ''}
              onChange={(e) => setLat(e.target.value === '' ? NaN : Number(e.target.value))}
            />
          </FormField>
          <FormField
            label="Longitude"
            required
            error={Number.isFinite(lon) && (lon < -180 || lon > 180) ? '−180…180' : undefined}
          >
            <Input
              type="number"
              step="any"
              value={Number.isFinite(lon) ? lon : ''}
              onChange={(e) => setLon(e.target.value === '' ? NaN : Number(e.target.value))}
            />
          </FormField>
          <FormField label=" ">
            <Button type="button" variant="outline" className="w-full" onClick={locate} loading={locating}>
              <LocateFixed className="h-4 w-4" /> GPS
            </Button>
          </FormField>
        </div>

        {addr && (
          <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            <MapPin className="inline h-3 w-3 mr-1" />
            Current: {addr.street}, {addr.city}, {addr.country} · H3 <span className="font-mono">{addr.h3_index}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          {addr && (
            <Button variant="outline" onClick={() => remove.mutate()} loading={remove.isPending} className="border-destructive/40 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          )}
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!canSave}>
            Save address
          </Button>
        </div>
      </Card>
    </div>
  );
}
