import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { priceId, promoCode } = await req.json();
    
    if (!priceId) {
      throw new Error('Price ID is required');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user email from Supabase Auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': authHeader,
        'apikey': supabaseKey,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user');
    }

    const user = await userResponse.json();
    const userEmail = user.email;
    const userId = user.id;

    // Check if user already has a Stripe customer ID
    const customerResponse = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&select=stripe_customer_id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    let customerId = null;
    if (customerResponse.ok) {
      const subscriptions = await customerResponse.json();
      if (subscriptions[0]?.stripe_customer_id) {
        customerId = subscriptions[0].stripe_customer_id;
      }
    }

    // Create new customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;
    }

    // Build checkout session params
    const sessionParams: any = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${Deno.env.get('APP_URL') || 'http://localhost:8080'}/dashboard?success=true`,
      cancel_url: `${Deno.env.get('APP_URL') || 'http://localhost:8080'}/pricing?canceled=true`,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        promo_code: promoCode || '',
      },
    };

    // Apply promo code discount if provided
    if (promoCode) {
      // Validate promo code
      const promoResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/validate_promo_code`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_code: promoCode }),
        }
      );

      if (promoResponse.ok) {
        const promoResult = await promoResponse.json();
        if (promoResult[0]?.valid && promoResult[0]?.discount_percent > 0) {
          // Create Stripe coupon for discount
          const coupon = await stripe.coupons.create({
            percent_off: promoResult[0].discount_percent,
            duration: 'once',
            name: `Promo: ${promoCode}`,
          });

          sessionParams.discounts = [{ coupon: coupon.id }];
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


