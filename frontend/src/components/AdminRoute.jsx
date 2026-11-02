import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * AdminRoute – renders children only for authenticated admin users.
 * Non‑admin users are redirected to the home page.
 */
const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="loading-spinner">Loading…</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    // Authenticated but not admin – redirect to home or a not‑authorized page.
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
