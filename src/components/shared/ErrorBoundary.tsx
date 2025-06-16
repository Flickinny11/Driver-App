import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

/**
 * Error boundary component to catch and handle React errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    if (import.meta.env.PROD) {
      // In production, you might want to send this to an error tracking service
      console.error('Production error:', { error, errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full glass-card p-8 text-center">
            <div className="flex justify-center mb-6">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
            
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error. This has been logged and we're working to fix it.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-primary px-4 py-2 flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary px-4 py-2"
              >
                Reload Page
              </button>
            </div>
            
            <div className="mt-6 text-xs text-muted-foreground">
              If the problem persists, please contact support.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}