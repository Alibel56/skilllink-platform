import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Mail, Phone, Calendar, MapPin, Edit, Camera, Trash2,
  ShieldCheck, ShieldAlert, FileBadge,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { users, files, address as addressApi } from '@/lib/api';
import { useMySpecialistId } from '@/lib/use-specialist';
import { initials, formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({ queryKey: ['users', 'profile'], queryFn: users.profile });
  const { data: addr } = useQuery({
    queryKey: ['address'],
    queryFn: () => addressApi.get(),
    retry: false,
  });

  const upload = useMutation({
    mutationFn: (file: File) => files.uploadAvatar(file),
    onSuccess: () => { qc.invalidateQueries(); toast.success('Avatar updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAvatar = useMutation({
    mutationFn: (userId: string) => files.deleteAvatar(userId),
    onSuccess: () => { qc.invalidateQueries(); toast.success('Avatar removed'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !profile) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const isSpecialist = profile.role === 'specialist';
  const specialistId = useMySpecialistId();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="Your account, address, and verification."
        actions={
          <>
            <Button asChild variant="outline"><Link to="/profile/edit"><Edit className="h-4 w-4" /> Edit profile</Link></Button>
            {!isSpecialist && (
              <Button asChild><Link to="/profile/become-specialist">Become specialist</Link></Button>
            )}
          </>
        }
      />

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-background shadow-soft">
              <AvatarImage src={files.avatarUrl(profile.id)} />
              <AvatarFallback className="text-2xl">{initials(profile.name, profile.surname)}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInput.current?.click()}
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated hover:bg-primary/90"
              aria-label="Upload avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
              }}
            />
          </div>
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">{profile.name} {profile.surname}</h2>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="capitalize">{profile.role}</Badge>
                <span className="text-xs text-muted-foreground">Joined {formatDate(profile.created_at)}</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <Info icon={Mail} label={profile.email} />
              <Info icon={Phone} label={profile.phone} />
              <Info icon={Calendar} label={`Born ${formatDate(profile.birth_date)}`} />
              {addr && (
                <Info icon={MapPin} label={`${addr.city}, ${addr.country}`} />
              )}
            </div>
            <div>
              <Button variant="ghost" size="sm" onClick={() => removeAvatar.mutate(profile.id)}>
                <Trash2 className="h-3.5 w-3.5" /> Remove avatar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Address
              </h3>
              <p className="text-sm text-muted-foreground">Used for geo-aware specialist matching.</p>
            </div>
            <Button asChild size="sm" variant="outline"><Link to="/profile/address">Manage</Link></Button>
          </div>
          {addr ? (
            <p className="text-sm">{addr.street}, {addr.city}, {addr.country} <span className="font-mono text-xs text-muted-foreground">· {addr.h3_index.slice(0, 8)}</span></p>
          ) : (
            <p className="text-sm text-muted-foreground">No address set yet.</p>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {isSpecialist ? <ShieldCheck className="h-4 w-4 text-success" /> : <ShieldAlert className="h-4 w-4 text-muted-foreground" />} Specialist status
              </h3>
              <p className="text-sm text-muted-foreground">{isSpecialist ? 'You are registered as a specialist.' : 'Not registered as a specialist.'}</p>
            </div>
            {isSpecialist ? (
              <Button asChild size="sm" variant="outline"><Link to="/profile/accreditation"><FileBadge className="h-3.5 w-3.5" /> Accreditation</Link></Button>
            ) : (
              <Button asChild size="sm"><Link to="/profile/become-specialist">Apply</Link></Button>
            )}
          </div>
          {specialistId && (
            <p className="text-xs font-mono text-muted-foreground">ID: {specialistId}</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
