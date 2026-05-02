import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, MessageSquare, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/lib/auth-store';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-12 sm:px-12 sm:py-16 gradient-mesh">
        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-success" /> Verified pros · 4.8★ avg
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance leading-[1.05]">
            {user ? <>Welcome back, <span className="text-primary">{user.name}</span>.</> : <>Find a trusted local <span className="text-primary">specialist</span>.</>}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl text-pretty">
            From plumbing to tutoring — book verified pros near you, chat in real time,
            and pay only when the job is done.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={() => navigate('/search')}>
              <Search className="h-4 w-4" /> Find a specialist
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/orders/new')}>
              Post a job <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Browse by category</h2>
          <Link to="/search" className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/search?job_type=${c.id}`}
              className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-elevated hover:border-primary/30"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="font-medium text-sm">{c.label}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { i: ShieldCheck, t: 'Verified specialists', d: 'Every pro is reviewed and rated by clients before listing.' },
          { i: MapPin, t: 'Geo-aware search', d: 'Powered by H3 spatial indexing — find help nearby in seconds.' },
          { i: MessageSquare, t: 'Real-time chat', d: 'Talk through the job, share details, agree on the price.' },
        ].map((step, idx) => (
          <Card key={idx} className="p-6 space-y-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <step.i className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">{step.t}</h3>
              <p className="text-sm text-muted-foreground">{step.d}</p>
            </div>
          </Card>
        ))}
      </section>

      {/* CTA */}
      <section className="rounded-2xl border bg-foreground text-background p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="space-y-1.5 flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">Are you a specialist?</h2>
          <p className="text-sm opacity-80 max-w-md">
            Become a SkillLink pro — get matched with clients in your area and grow your business.
          </p>
        </div>
        <Button size="lg" variant="default" className="bg-background text-foreground hover:bg-background/90" onClick={() => navigate('/profile/become-specialist')}>
          Join as a pro
        </Button>
      </section>
    </div>
  );
}
