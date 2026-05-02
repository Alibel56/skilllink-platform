import { Link, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailPendingPage() {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Confirm your email</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          {email
            ? <>We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.</>
            : <>We sent you a confirmation link.</>}
          <br />Click it to activate your account, then come back to log in.
        </p>
      </div>

      <div className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground text-left">
        <p className="font-medium text-foreground mb-1">Didn't get it?</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Check your spam/junk folder</li>
          <li>Try registering again with the same email — the latest link wins</li>
          <li>Make sure you typed your address correctly</li>
        </ul>
      </div>

      <Button asChild variant="outline" className="w-full">
        <Link to="/login">Go to login</Link>
      </Button>
    </div>
  );
}
