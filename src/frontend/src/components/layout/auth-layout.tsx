import { Sparkles } from 'lucide-react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-store';

export function AuthLayout() {
  const { token } = useAuth();
  if (token) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 gradient-mesh">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-indigo-700 text-primary-foreground">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <Sparkles className="h-4 w-4" />
          </div>
          SkillLink
        </Link>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-balance">
            Find trusted local specialists in minutes.
          </h2>
          <p className="text-base text-white/85 max-w-md text-pretty">
            Plumbers, electricians, cleaners — verified, rated, and ready when you need them.
            Built for clients and pros alike.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-white/80">
            <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">Verified pros</span>
            <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">Real-time chat</span>
            <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">Geo search</span>
            <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">Reviews</span>
          </div>
        </div>
        <p className="text-xs text-white/60">© SkillLink — service marketplace.</p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-10 sm:px-12">
        <Link to="/" className="mb-8 flex items-center gap-2 font-semibold lg:hidden">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          SkillLink
        </Link>
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
