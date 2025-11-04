/**
 * SubscriptionGuard Component
 * Protects routes that require active subscription
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { getUserSubscription } from '@/lib/subscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan?: 'free' | 'standard' | 'pro' | 'enterprise';
}

const PLAN_HIERARCHY = {
  free: 0,
  standard: 1,
  pro: 2,
  enterprise: 3,
};

export const SubscriptionGuard = ({ 
  children, 
  requiredPlan = 'standard' 
}: SubscriptionGuardProps) => {
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    checkSubscription();
  }, [location.pathname, user]);

  const checkSubscription = async () => {
    if (!user) {
      setChecking(false);
      setHasAccess(false);
      return;
    }

    try {
      const subscription = await getUserSubscription();
      
      if (!subscription) {
        setHasAccess(false);
        setCurrentPlan('free');
        setChecking(false);
        return;
      }

      setCurrentPlan(subscription.plan);

      // Check if subscription is active
      const isActive = ['active', 'trialing'].includes(subscription.status);
      
      // Check plan hierarchy
      const userPlanLevel = PLAN_HIERARCHY[subscription.plan as keyof typeof PLAN_HIERARCHY] || 0;
      const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan] || 0;
      
      const access = isActive && userPlanLevel >= requiredPlanLevel;
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasAccess(false);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking subscription...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              This feature requires a {requiredPlan} subscription or higher
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your current plan: <strong className="capitalize text-foreground">{currentPlan}</strong>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.location.href = '/pricing'}
                className="w-full"
              >
                View Pricing & Upgrade
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Have a promo code?{' '}
              <a href="/subscribe?plan=standard" className="text-primary hover:underline">
                Redeem it here
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

