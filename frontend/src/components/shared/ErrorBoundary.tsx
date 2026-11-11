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
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-warning" />
          <h2 className="mb-2 text-lg font-semibold text-primary">Something went wrong</h2>
          <p className="mb-4 max-w-md text-sm text-tertiary">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={this.handleRetry}
            className="text-primary-fg inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-hover"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
          {this.state.error?.message && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-xs text-tertiary hover:text-secondary">
                Error details
              </summary>
              <pre className="mt-2 max-w-full overflow-auto rounded-lg bg-subtle p-3 text-xs text-tertiary">
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
