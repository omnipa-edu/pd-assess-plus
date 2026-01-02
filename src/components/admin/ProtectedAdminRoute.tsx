/**
 * ProtectedAdminRoute Component
 * Wrapper for admin-only routes with automatic redirect for non-admins
 */

import { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

import { useToast } from '@/components/ui/use-toast';
import { isAdmin } from '@/lib/admin/guard';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const result = await isAdmin();
      
      if (!result.isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin console.",
          variant: "destructive"
        });
      }
      
      setAuthorized(result.isAdmin);
      setChecking(false);
    };

    checkAdminStatus();
  }, [location.pathname, toast]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

