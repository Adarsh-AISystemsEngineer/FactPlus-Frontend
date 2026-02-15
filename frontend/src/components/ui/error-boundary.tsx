/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error messages
 */

import React, { ReactNode, ReactElement } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactElement;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 rounded-xl p-8 border-2 border-red-300 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-4 text-sm">
              We encountered an error while displaying this analysis. Please try refreshing the page.
            </p>
            <details className="text-left bg-red-100 rounded p-3 text-xs text-red-800 max-h-32 overflow-y-auto mb-4">
              <summary className="cursor-pointer font-semibold mb-2">Error details</summary>
              <code className="block whitespace-pre-wrap break-words">
                {this.state.error.toString()}
              </code>
            </details>
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional Error Boundary (for newer React versions)
 * Use this if you need suspense support or other modern features
 */
export function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 rounded-xl p-8 border-2 border-red-300 text-center">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-700 mb-2">Analysis Display Error</h3>
        <p className="text-red-600 mb-4">We encountered an error while displaying this analysis.</p>
        <details className="text-left bg-red-100 rounded p-3 text-xs text-red-800 max-h-32 overflow-y-auto mb-4">
          <summary className="cursor-pointer font-semibold mb-2">Error details</summary>
          <code className="block whitespace-pre-wrap break-words">
            {error?.message || "Unknown error"}
          </code>
        </details>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
