import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Search, Calendar, MessageSquare, Briefcase, Layers, Inbox,
  User, Settings, LogOut, Sparkles, Shield,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth-store';
import { auth, users, files } from '@/lib/api';
import { initials } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  client: [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/orders', label: 'My orders', icon: Calendar },
    { to: '/orders/new', label: 'New order', icon: Briefcase },
    { to: '/requests', label: 'Requests', icon: Inbox },
  ],
  specialist: [
    { to: '/jobs', label: 'Open jobs', icon: Briefcase },
    { to: '/jobs/mine', label: 'My jobs', icon: Calendar },
    { to: '/catalog', label: 'My catalog', icon: Layers },
  ],
  admin: [
    { to: '/admin', label: 'Admin panel', icon: Shield },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/orders', label: 'Orders', icon: Calendar },
  ],
};

export function AppShell() {
  const navigate = useNavigate();
  const { token, user, setUser, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['users', 'profile'],
    queryFn: () => users.profile(),
    enabled: !!token,
  });

  useEffect(() => {
    if (profile) setUser(profile);
  }, [profile, setUser]);

  const role = (user?.role ?? profile?.role ?? 'client') as keyof typeof NAV_BY_ROLE;
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.client;
  const me = profile ?? user;

  async function handleLogout() {
    try { await auth.logout(); } catch { /* ignore */ }
    signOut();
    toast.success('Signed out');
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span>SkillLink</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {me && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-accent transition-colors">
                    <Avatar className="h-8 w-8">
                      {me?.id && <AvatarImage src={files.avatarUrl(me.id)} alt={me.name} />}
                      <AvatarFallback>{initials(me.name, me.surname)}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left text-sm leading-tight">
                      <div className="font-medium">{me.name} {me.surname}</div>
                      <div className="text-xs text-muted-foreground capitalize">{me.role}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{me.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4" /> My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile/edit')}>
                    <Settings className="h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <MessageSquare className="h-4 w-4" /> My orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!me && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            )}
          </div>
        </div>

        {/* mobile nav */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-3 pb-2 scrollbar-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t bg-background py-6 text-center text-xs text-muted-foreground">
        SkillLink — service marketplace · Built with FastAPI · Tailwind · React
      </footer>
    </div>
  );
}
