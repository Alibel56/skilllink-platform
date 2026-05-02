import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/api';

export default function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [error, setError] = useState('');
  const fired = useRef(false);

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Missing confirmation token.'); return; }
    if (fired.current) return;
    fired.current = true;
    auth.confirmEmail(token)
      .then(() => setStatus('success'))
      .catch((e) => { setStatus('error'); setError(e instanceof Error ? e.message : 'Confirmation failed'); });
  }, [token]);

  return (
    <div className="space-y-6 text-center">
      {status === 'pending' && (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h1 className="text-xl font-semibold">Confirming your email…</h1>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold">Email confirmed</h1>
            <p className="text-sm text-muted-foreground">Your account is ready to use.</p>
          </div>
          <Button asChild className="w-full"><Link to="/login">Continue to login</Link></Button>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold">Confirmation failed</h1>
            <p className="text-sm text-muted-foreground">{error || 'Try again or contact support.'}</p>
          </div>
          <Button asChild variant="outline" className="w-full"><Link to="/signup">Back to signup</Link></Button>
        </>
      )}
    </div>
  );
}
