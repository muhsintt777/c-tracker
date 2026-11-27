import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { authService } from '@/infra/firebase/authService';
import { periodRepository } from '@/infra/firebase/periodRepository';
import { AppServicesProvider } from './providers/AppServicesContext';
import { AuthProvider, useAuth } from './providers/AuthContext';

const Dashboard = lazy(() =>
  import('@/ui/features/dashboard/Dashboard').then((module) => ({
    default: module.Dashboard,
  })),
);
const LoginPage = lazy(() =>
  import('@/ui/features/auth/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
);

function RouteLoading() {
  return (
    <div className="app-loading" role="status">
      Loading…
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="app-loading" role="status">
        Loading your cycle data…
      </div>
    );

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Suspense fallback={<RouteLoading />}>
              <LoginPage />
            </Suspense>
          )
        }
      />
      <Route
        path="/"
        element={
          user ? (
            <Suspense fallback={<RouteLoading />}>
              <Dashboard />
            </Suspense>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider service={authService}>
      <AppServicesProvider periodRepository={periodRepository}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppServicesProvider>
    </AuthProvider>
  );
}
