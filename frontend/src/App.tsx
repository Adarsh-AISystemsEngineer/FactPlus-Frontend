import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import { ProtectedRoute } from "@/components/layout/protected-route";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";

// Lazy load heavy components
const ChatPage = lazy(() => import("@/pages/chat"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const KnowledgeGraph = lazy(() => import("@/pages/knowledge-graph"));
const Settings = lazy(() => import("@/pages/settings"));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing}/>
      <Route path="/auth" component={AuthPage}/>
      <Route path="/dashboard">
        {() => (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Suspense>
        )}
      </Route>
      <Route path="/chat/:id">
        {(params) => (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          </Suspense>
        )}
      </Route>
      <Route path="/chat">
        {() => (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          </Suspense>
        )}
      </Route>
      <Route path="/knowledge-graph">
        {() => (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <KnowledgeGraph />
            </ProtectedRoute>
          </Suspense>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <Suspense fallback={<LoadingFallback />}>
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </Suspense>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;