import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";

const Dashboard = lazy(() => import("../features/dashboard/Dashboard").then((module) => ({ default: module.Dashboard })));
const LoginPage = lazy(() => import("../features/auth/LoginPage").then((module) => ({ default: module.LoginPage })));

function RouteLoading() {
  return <div className="app-loading" role="status">Loading…</div>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading" role="status">Loading your cycle data…</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Suspense fallback={<RouteLoading />}><LoginPage /></Suspense>} />
      <Route path="/" element={user ? <Suspense fallback={<RouteLoading />}><Dashboard /></Suspense> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
