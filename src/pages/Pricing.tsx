/**
 * Pricing Page
 * Displays subscription tiers and pricing with promo code support
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getUserSubscription } from '@/lib/subscription';

interface PricingTier {
  name: string;
  price: number;
  priceId: string; // Stripe Price ID
  description: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
  color: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    priceId: 'free',
    description: 'Perfect for trying out the platform',
    features: [
      'Up to 10 assessments per month',
      'Basic reporting',
      'Email support',
      'Single user',
    ],
    icon: Sparkles,
    color: 'text-gray-600 dark:text-gray-400',
  },
  {
    name: 'Standard',
    price: 29,
    priceId: import.meta.env.VITE_STRIPE_PRICE_STANDARD || 'price_standard',
    description: 'For individual supervisors and small teams',
    features: [
      'Unlimited assessments',
      'Advanced reporting & analytics',
      'Voice-to-text transcription',
      'Priority email support',
      'Up to 5 supervisors',
      'Export to PDF',
    ],
    icon: Zap,
    recommended: true,
    color: 'text-primary',
  },
  {
    name: 'Pro',
    price: 99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO || 'price_pro',
    description: 'For departments and larger programs',
    features: [
      'Everything in Standard',
      'Unlimited supervisors',
      'Custom EPA frameworks',
      'Bulk EPA import',
      'Admin console access',
      'API access',
      'Dedicated support',
      'Custom integrations',
    ],
    icon: Crown,
    color: 'text-purple-600 dark:text-purple-400',
  },
];

const Pricing = () => {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    const subscription = await getUserSubscription();
    if (subscription) {
      setCurrentPlan(subscription.plan);
    }
    setLoading(false);
  };

  const handleSelectPlan = (priceId: string, planName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (priceId === 'free') {
      navigate('/dashboard');
      return;
    }

    navigate(`/subscribe?plan=${planName.toLowerCase()}&priceId=${priceId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10 transition-colors duration-200">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              ← Back to Home
            </Button>
            {user && (
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Choose Your Plan
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Start with our free tier or upgrade for unlimited assessments, advanced reporting, and premium features.
        </p>

        {user && currentPlan !== 'free' && (
          <div className="mx-auto mt-6 max-w-md">
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">
                Current Plan: <strong className="capitalize">{currentPlan}</strong>
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-8 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => {
            const Icon = tier.icon;
            const isCurrentPlan = tier.name.toLowerCase() === currentPlan;

            return (
              <Card
                key={tier.name}
                className={`relative flex flex-col ${
                  tier.recommended
                    ? 'border-primary/50 shadow-lg ring-2 ring-primary/20 dark:shadow-primary/10'
                    : ''
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Recommended
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className={`h-8 w-8 ${tier.color}`} />
                    {isCurrentPlan && (
                      <Badge variant="secondary">Current Plan</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4 text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    {tier.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={tier.recommended ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(tier.priceId, tier.name)}
                    disabled={loading || isCurrentPlan}
                  >
                    {loading
                      ? 'Loading...'
                      : isCurrentPlan
                      ? 'Current Plan'
                      : tier.price === 0
                      ? 'Get Started Free'
                      : 'Upgrade Now'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Promo Code Info */}
        <div className="mx-auto mt-12 max-w-2xl rounded-lg border bg-card p-6 text-center">
          <h3 className="text-lg font-semibold">Have a Promo Code?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You'll be able to enter your promo code during checkout to unlock discounts or free access.
          </p>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I switch plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes! You can upgrade or downgrade at any time. Changes take effect at the start of your next billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards (Visa, Mastercard, Amex) through our secure Stripe integration.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Absolutely. You can cancel your subscription at any time. You'll retain access until the end of your current billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do promo codes work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enter your promo code during checkout. Some codes provide discounts, while others grant free access for a limited time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;


