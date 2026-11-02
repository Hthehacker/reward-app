import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute – renders the child element only when the user is authenticated.
 * If not authenticated, redirects to the home page ("/"), where the login modal can be opened.
 */
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isAuthLoading } = useAuth(); // isAuthLoading could be added later; fallback to false

  // Show a simple loading state while auth is being restored (optional).
  if (isAuthLoading) {
    return <div className="loading-spinner">Loading…</div>;
  }

  if (!isLoggedIn) {
    // Redirect unauthenticated users to home (login modal is triggered there).
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
