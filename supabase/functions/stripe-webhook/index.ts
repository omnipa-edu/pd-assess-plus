import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error('No user ID in checkout session');
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  let plan = 'standard';
  
  if (priceId === Deno.env.get('STRIPE_PRICE_PRO')) {
    plan = 'pro';
  } else if (priceId === Deno.env.get('STRIPE_PRICE_ENTERPRISE')) {
    plan = 'enterprise';
  }

  // Update or create subscription
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      metadata: session.metadata,
    });

  if (error) {
    console.error('Error updating subscription:', error);
    return;
  }

  // Create transaction record
  const amount = session.amount_total || 0;
  await supabase.from('transactions').insert({
    user_id: userId,
    stripe_payment_id: session.payment_intent as string,
    stripe_session_id: session.id,
    amount_cents: amount,
    currency: session.currency || 'usd',
    status: 'completed',
    plan,
    metadata: {
      promo_code: session.metadata?.promo_code,
    },
  });

  // Redeem promo code if provided
  if (session.metadata?.promo_code) {
    await supabase.rpc('redeem_promo_code', {
      p_code: session.metadata.promo_code,
      p_user_id: userId,
    });
  }

  console.log(`Subscription activated for user ${userId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!existingSub) {
    console.error('Subscription not found for customer:', customerId);
    return;
  }

  // Update subscription
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('user_id', existingSub.user_id);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  console.log(`Subscription updated for customer ${customerId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find and update subscription
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error canceling subscription:', error);
  }

  console.log(`Subscription canceled for customer ${customerId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  // Record successful payment
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id, plan')
    .eq('stripe_customer_id', customerId)
    .single();

  if (sub) {
    await supabase.from('transactions').insert({
      user_id: sub.user_id,
      stripe_payment_id: invoice.payment_intent as string,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: 'completed',
      plan: sub.plan,
      metadata: {
        invoice_id: invoice.id,
        subscription_id: subscriptionId,
      },
    });
  }

  console.log(`Payment succeeded for customer ${customerId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Update subscription status to past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating subscription to past_due:', error);
  }

  console.log(`Payment failed for customer ${customerId}`);
}

