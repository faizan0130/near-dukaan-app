'use client';

import { useAuth } from './authContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Component to protect routes. Redirects unauthenticated users to the login page.
 */
const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is false AND user is null (not logged in), redirect to login
    // This logic protects routes like /dashboard, /customers, etc.
    if (!loading && !user) {
      // Delaying the push slightly ensures the router is fully ready
      setTimeout(() => {
        router.replace('/login');
      }, 50);
    }
  }, [user, loading, router]);

  // If still loading, show a loading message
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Checking Authentication...</p>
      </div>
    );
  }

  // If user is logged in, render the children (the protected page content)
  if (user) {
    return <>{children}</>;
  }
  
  // Otherwise, return null while the redirect happens
  return null;
};

export default AuthGuard;