import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-destructive/20">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-display font-bold text-white mb-2">
                  Something Went Wrong
                </h1>
                <p className="text-sm text-muted-foreground mb-4">
                  We encountered an unexpected error. Please try refreshing the page or going back home.
                </p>
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="mt-4 p-3 bg-black/30 rounded text-left text-xs font-mono text-red-400 overflow-auto max-h-48">
                    <summary className="cursor-pointer font-bold mb-2">Error Details</summary>
                    <pre className="whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={this.resetError}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  className="flex-1 border-white/10"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
