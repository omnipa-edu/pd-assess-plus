/**
 * Billing Page
 * View subscription status, billing history, and manage account
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, DollarSign, Receipt, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getUserSubscription } from '@/lib/subscription';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  plan: string;
  created_at: string;
  metadata: any;
}

const Billing = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [sub, trans] = await Promise.all([
        getUserSubscription(),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      setSubscription(sub);
      setTransactions(trans.data || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'standard':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pro':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'past_due':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'canceled':
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your subscription and view billing history
            </p>
          </div>

          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>Your active plan and billing details</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <Badge className={getPlanBadgeColor(subscription.plan)}>
                      {subscription.plan}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={getStatusBadgeColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>
                  {subscription.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {subscription.cancel_at_period_end ? 'Expires on:' : 'Renews on:'}
                      </span>
                      <span className="text-sm font-medium">
                        {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  {subscription.plan === 'free' && (
                    <div className="mt-4">
                      <Button onClick={() => navigate('/pricing')} className="w-full">
                        Upgrade Plan
                      </Button>
                    </div>
                  )}

                  {subscription.cancel_at_period_end && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/50 dark:bg-orange-900/20">
                      <p className="text-sm text-orange-900 dark:text-orange-100">
                        Your subscription will be canceled at the end of the current period.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No active subscription</p>
                  <Button className="mt-4" onClick={() => navigate('/pricing')}>
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>Your payment and transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : transactions.length === 0 ? (
                <div className="py-8 text-center">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{transaction.plan} Plan</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                          </p>
                          {transaction.metadata?.promo_code && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              <Tag className="mr-1 h-3 w-3" />
                              {transaction.metadata.promo_code}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(transaction.amount_cents / 100).toFixed(2)}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            transaction.status === 'completed'
                              ? 'border-green-500 text-green-700 dark:text-green-400'
                              : ''
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
                <CardDescription>Contact our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upgrade or Change Plan</CardTitle>
                <CardDescription>View all available plans</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/pricing')} className="w-full">
                  View Pricing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Billing;


