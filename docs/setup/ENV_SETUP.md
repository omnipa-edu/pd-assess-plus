# Environment Variables Setup

Copy this to `.env.local` in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Stripe Configuration (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_PRICE_STANDARD=price_your_standard_price_id
VITE_STRIPE_PRICE_PRO=price_your_pro_price_id

# App Configuration
VITE_APP_URL=http://localhost:8080

# Smart Feedback Assistant (optional)
# Set to 'false' or '0' to disable the Smart Feedback Assistant feature
# Defaults to enabled if not set
VITE_ENABLE_SMART_FEEDBACK_ASSISTANT=true
```

---

## Supabase Edge Functions Environment

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_STANDARD=price_your_standard_price_id
STRIPE_PRICE_PRO=price_your_pro_price_id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
APP_URL=http://localhost:8080
OPENAI_API_KEY=sk-your-openai-key-here
```

---

## Getting the Keys

### Supabase:
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy `URL` and `anon/public` key

### Stripe:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy publishable key (pk_test_...)
3. Copy secret key (sk_test_...)
4. Create products → get price IDs (price_...)
5. Set up webhook → get webhook secret (whsec_...)

### OpenAI (for voice-to-text):
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and save securely


