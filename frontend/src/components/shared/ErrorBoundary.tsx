import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-warning mb-4" />
          <h2 className="text-lg font-semibold text-primary mb-2">Something went wrong</h2>
          <p className="text-sm text-tertiary mb-4 max-w-md">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-fg hover:bg-primary-hover transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
          {this.state.error?.message && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-tertiary cursor-pointer hover:text-secondary">Error details</summary>
              <pre className="mt-2 text-xs text-tertiary bg-subtle p-3 rounded-lg overflow-auto max-w-full">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
