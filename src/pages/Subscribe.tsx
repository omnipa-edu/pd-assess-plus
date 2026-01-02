/**
 * Subscribe Page
 * Handles subscription checkout with promo code support
 */

import { useState, useEffect } from 'react';

import { CreditCard, Tag, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { validatePromoCode, redeemPromoCode } from '@/lib/subscription';

interface PlanDetails {
  name: string;
  price: number;
  priceId: string;
}

const PLAN_DETAILS: Record<string, PlanDetails> = {
  standard: {
    name: 'Standard',
    price: 29,
    priceId: import.meta.env.VITE_STRIPE_PRICE_STANDARD || 'price_standard',
  },
  pro: {
    name: 'Pro',
    price: 99,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO || 'price_pro',
  },
};

const Subscribe = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'standard';
  const priceId = searchParams.get('priceId') || PLAN_DETAILS[plan]?.priceId;
  
  const [promoCode, setPromoCode] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoValid, setPromoValid] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [discount, setDiscount] = useState(0);
  const [freeAccess, setFreeAccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const planDetails = PLAN_DETAILS[plan];
  const finalPrice = planDetails ? planDetails.price * (1 - discount / 100) : 0;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;

    setValidatingPromo(true);
    try {
      const result = await validatePromoCode(promoCode);
      
      setPromoValid(result.valid);
      setPromoMessage(result.message);
      
      if (result.valid) {
        setDiscount(result.discount_percent);
        setFreeAccess(result.free_access);
        
        const accessMessage = result.free_access
          ? result.free_duration_days
            ? `You will get ${result.free_duration_days} days of free access`
            : 'You will get lifetime free access'
          : `${result.discount_percent}% discount applied`;
        
        toast({
          title: 'Promo Code Valid!',
          description: accessMessage,
        });
      } else {
        setDiscount(0);
        setFreeAccess(false);
        
        toast({
          title: 'Invalid Promo Code',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error validating promo:', error);
      toast({
        title: 'Validation Error',
        description: 'Failed to validate promo code',
        variant: 'destructive',
      });
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    setProcessing(true);
    try {
      // If free access via promo code, redeem directly
      if (freeAccess) {
        const result = await redeemPromoCode(promoCode);
        
        if (result.success) {
          toast({
            title: 'Success!',
            description: 'Free access granted. Redirecting to dashboard...',
          });
          
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          throw new Error(result.message);
        }
        return;
      }

      // Otherwise, create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          promoCode: promoValid ? promoCode : null,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: 'Checkout Error',
        description: error.message || 'Failed to start checkout process',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!planDetails) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Plan</CardTitle>
            <CardDescription>The selected plan was not found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pricing')}>
              View Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 dark:to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscribe to {planDetails.name}</CardTitle>
            <Badge className="bg-primary">${planDetails.price}/mo</Badge>
          </div>
          <CardDescription>
            Complete your subscription to unlock all features
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Promo Code Section */}
          <div className="space-y-3">
            <Label htmlFor="promo-code" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Promo Code (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="promo-code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoValid(false);
                  setDiscount(0);
                  setFreeAccess(false);
                }}
                placeholder="Enter code"
                className="uppercase"
                disabled={processing}
              />
              <Button
                variant="outline"
                onClick={handleValidatePromo}
                disabled={!promoCode.trim() || validatingPromo || processing}
              >
                {validatingPromo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>

            {/* Promo Status */}
            {promoMessage && (
              <div className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                promoValid
                  ? 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100'
                  : 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100'
              }`}>
                {promoValid ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{promoMessage}</span>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium">{planDetails.name}</span>
            </div>
            
            {promoValid && discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  -{discount}%
                </span>
              </div>
            )}

            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Total:</span>
              <div className="text-right">
                {freeAccess ? (
                  <div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      FREE
                    </span>
                    <p className="text-xs text-muted-foreground">via promo code</p>
                  </div>
                ) : (
                  <div>
                    {discount > 0 && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${planDetails.price}
                      </span>
                    )}
                    <span className="ml-2 text-2xl font-bold">
                      ${finalPrice.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={handleSubscribe}
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : freeAccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Activate Free Access
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Checkout
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              🔒 Secure checkout powered by Stripe. Your payment information is never stored on our servers.
            </p>
          </div>

          {/* Cancel */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pricing')}
              disabled={processing}
            >
              ← Back to Pricing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscribe;

