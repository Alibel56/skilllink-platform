import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes anywhere below it so a single bad component
 * doesn't blank the entire app. Shows a minimal recovery UI; real error
 * monitoring can hook into componentDidCatch later.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log so it's visible in the browser console even with React 18 swallowing.
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-destructive/10 text-destructive text-2xl">
            !
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Что-то пошло не так</h1>
          <p className="text-sm text-muted-foreground break-words">
            {this.state.error.message || 'Unexpected render error'}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={this.reset}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => window.location.assign('/')}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }
}
