import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f7e7ce] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border-t-8 border-[#a53d4c]">
            <i className="fa-solid fa-triangle-exclamation text-4xl text-[#a53d4c] mb-4"></i>
            <h1 className="text-xl font-black text-[#a53d4c] uppercase mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#a53d4c] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-[#8b2635] transition-colors"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left bg-gray-50 p-3 rounded text-xs text-gray-500 overflow-auto max-h-32">
                <summary className="cursor-pointer font-bold mb-1">Error Details</summary>
                {this.state.error.toString()}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
