/**
 * Subscription Utilities
 * Helper functions for managing subscriptions and promo codes
 */

import { supabase } from '@/integrations/supabase/client';

export type SubscriptionPlan = 'free' | 'standard' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled' | 'trialing';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeValidation {
  valid: boolean;
  promo_id: string | null;
  discount_percent: number;
  free_access: boolean;
  free_duration_days: number | null;
  message: string;
}

/**
 * Get current user's subscription
 */
export async function getUserSubscription(): Promise<Subscription | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getUserSubscription();
  
  if (!subscription) return false;
  
  // Active or trialing status grants access
  if (['active', 'trialing'].includes(subscription.status)) {
    return true;
  }
  
  // Free plan always has access (limited features)
  if (subscription.plan === 'free' && subscription.status === 'active') {
    return true;
  }
  
  return false;
}

/**
 * Validate promo code
 */
export async function validatePromoCode(code: string): Promise<PromoCodeValidation> {
  try {
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: code
    });

    if (error) {
      console.error('Error validating promo code:', error);
      return {
        valid: false,
        promo_id: null,
        discount_percent: 0,
        free_access: false,
        free_duration_days: null,
        message: 'Error validating code',
      };
    }

    return data[0];
  } catch (error) {
    console.error('Error validating promo code:', error);
    return {
      valid: false,
      promo_id: null,
      discount_percent: 0,
      free_access: false,
      free_duration_days: null,
      message: 'Error validating code',
    };
  }
}

/**
 * Redeem promo code
 */
export async function redeemPromoCode(
  code: string,
  transactionId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    const { data, error } = await supabase.rpc('redeem_promo_code', {
      p_code: code,
      p_user_id: user.id,
      p_transaction_id: transactionId || null,
    });

    if (error) {
      console.error('Error redeeming promo code:', error);
      return { success: false, message: error.message };
    }

    return data[0];
  } catch (error: any) {
    console.error('Error redeeming promo code:', error);
    return { success: false, message: error.message || 'Failed to redeem code' };
  }
}

/**
 * Get subscription status for user
 */
export async function getSubscriptionStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_subscription_status', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }

    return data[0] || null;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
}

/**
 * Create or get Stripe customer ID
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string | null> {
  try {
    // Check if customer ID exists
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subscription?.stripe_customer_id) {
      return subscription.stripe_customer_id;
    }

    // Create customer via Stripe API (handled by Edge Function)
    return null;
  } catch (error) {
    console.error('Error getting Stripe customer:', error);
    return null;
  }
}


