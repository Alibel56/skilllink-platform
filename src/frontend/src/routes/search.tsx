import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Filter, Search as SearchIcon, BadgeCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { specialists } from '@/lib/api';
import { CATEGORIES, categoryLabel } from '@/lib/constants';
import { DEFAULT_LAT, DEFAULT_LON, getGPS, formatRelative, shortId } from '@/lib/utils';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialJob = params.get('job_type') ?? '';
  const [jobType, setJobType] = useState(initialJob);
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') ?? '');
  const [k, setK] = useState(Number(params.get('k') ?? 10));
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: Number(params.get('lat') ?? DEFAULT_LAT),
    lon: Number(params.get('lon') ?? DEFAULT_LON),
  });
  const [locating, setLocating] = useState(false);

  const search = useMemo(
    () => ({ lat: coords.lat, lon: coords.lon, k, job_type: jobType || undefined, max_price: maxPrice ? Number(maxPrice) : undefined }),
    [coords, k, jobType, maxPrice],
  );

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['specialists', 'search', search],
    queryFn: () => specialists.search(search),
  });

  useEffect(() => {
    const next = new URLSearchParams();
    if (jobType) next.set('job_type', jobType);
    if (maxPrice) next.set('max_price', maxPrice);
    next.set('lat', String(coords.lat));
    next.set('lon', String(coords.lon));
    next.set('k', String(k));
    setParams(next, { replace: true });
  }, [jobType, maxPrice, coords, k, setParams]);

  async function useMyLocation() {
    setLocating(true);
    const c = await getGPS(5000);
    setCoords(c);
    setLocating(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find a specialist"
        description="Verified pros near you, ranked by location."
        actions={
          <Button variant="outline" onClick={useMyLocation} loading={locating}>
            <MapPin className="h-4 w-4" /> Use my location
          </Button>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <FormField label="Service" className="sm:col-span-2">
            <Select value={jobType || 'any'} onValueChange={(v) => setJobType(v === 'any' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Any service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any service</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Max price" hint="Optional">
            <Input
              type="number"
              min={1}
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </FormField>
          <FormField label="How many results">
            <Select value={String(k)} onValueChange={(v) => setK(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>Top {n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Searching near <span className="font-medium text-foreground">{coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            {jobType ? categoryLabel(jobType) : 'all services'}
            {maxPrice && ` · up to ${maxPrice}`}
          </span>
          {(isLoading || isFetching) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </div>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{(error as Error).message}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-24 w-full" /></Card>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No specialists found"
          description="Try widening your filters, increasing the result count, or using a different location."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((sp) => (
            <Link
              key={sp.id}
              to={`/specialists/${sp.id}`}
              className="group block focus:outline-none"
            >
              <Card className="p-5 h-full transition-all group-hover:shadow-elevated group-hover:border-primary/30">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {(sp.name?.[0] ?? '') + (sp.surname?.[0] ?? '') ||
                        shortId(sp.user_id, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {sp.name || sp.surname
                          ? `${sp.name ?? ''} ${sp.surname ?? ''}`.trim()
                          : `Specialist ${shortId(sp.id)}`}
                      </h3>
                      {sp.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Joined {formatRelative(sp.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sp.is_active ? (
                    <Badge variant="success">Available</Badge>
                  ) : (
                    <Badge variant="muted">Unavailable</Badge>
                  )}
                  {sp.is_verified && <Badge variant="default">Verified</Badge>}
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">{sp.h3_index.slice(0, 10)}…</span>
                  <span className="text-xs font-medium text-primary">View profile →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
