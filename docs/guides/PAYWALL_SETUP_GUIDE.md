# Paywall & Promo Code System - Setup Guide

**Status:** ✅ Complete and Ready to Deploy  
**Integration:** Stripe + Supabase  
**Features:** Subscriptions, Promo Codes, Billing History

---

## 📋 Overview

The paywall system provides:
- **Subscription tiers** (Free, Standard, Pro)
- **Promo codes** with discounts or free access
- **Stripe Checkout** integration for secure payments
- **Admin dashboard** for managing promo codes
- **Billing history** for users
- **Subscription guards** for protected routes

---

## 🚀 Quick Start

### 1. Run Database Migration

**In Supabase SQL Editor:**
```sql
-- Copy and run the entire file:
/supabase/migrations/20251103_paywall_promo_system.sql
```

This creates:
- `subscriptions` table
- `promo_codes` table  
- `transactions` table
- `promo_redemptions` table
- Validation functions
- RLS policies

### 2. Set Up Stripe

#### A. Create Stripe Account
1. Go to https://stripe.com
2. Create account (or use test mode)
3. Get API keys from Dashboard → Developers → API keys

#### B. Create Products & Prices

**In Stripe Dashboard:**
1. Products → Create product
2. Add prices:
   - **Standard:** $29/month recurring
   - **Pro:** $99/month recurring
3. Copy the Price IDs (starts with `price_...`)

### 3. Configure Environment Variables

Create `.env.local`:
```env
# Supabase (already configured)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe Public Key (frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_STANDARD=price_...
VITE_STRIPE_PRICE_PRO=price_...

# App URL
VITE_APP_URL=http://localhost:8080
```

Create `.env` for Supabase Functions:
```env
# Stripe Secret Key (backend only)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STANDARD=price_...
STRIPE_PRICE_PRO=price_...

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
APP_URL=http://localhost:8080
```

### 4. Deploy Supabase Functions

```bash
# Login to Supabase
npx supabase login

# Deploy checkout function
npx supabase functions deploy create-checkout-session --no-verify-jwt

# Deploy webhook function
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

### 5. Configure Stripe Webhook

**In Stripe Dashboard:**
1. Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://[your-supabase-url]/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret → add to `.env` as `STRIPE_WEBHOOK_SECRET`

### 6. Test the System

1. Visit: `http://localhost:8080/pricing`
2. Click "Upgrade Now" on Standard plan
3. Enter test promo code: `EARLYACCESS` (free 90-day trial)
4. Complete checkout (use Stripe test cards)
5. Verify subscription active in `/billing`

---

## 🎯 Features Documentation

### **Pricing Page** (`/pricing`)
- 3 subscription tiers (Free, Standard, Pro)
- Feature comparison cards
- "Recommended" badge on Standard tier
- Current plan indicator
- FAQ section
- Dark mode support

### **Subscribe Page** (`/subscribe`)
- Promo code input field
- Real-time validation
- Price calculation with discount
- Free access redemption
- Secure Stripe Checkout integration
- Security notice

### **Billing Page** (`/billing`)
- Current subscription status
- Renewal/expiration date
- Billing history (last 20 transactions)
- Promo code usage display
- Quick actions (upgrade, support)

### **Admin Promo Codes** (`/admin/promo-codes`)
- Create/edit/delete promo codes
- Random code generator
- Discount % or free access options
- Usage tracking (used/max)
- Expiration dates
- Active/inactive toggle
- Copy code to clipboard
- Stats dashboard
- Audit logging

---

## 🎟️ Promo Code Types

### **Discount Codes**
```typescript
{
  code: "SAVE20",
  discount_percent: 20,
  free_access: false,
  max_uses: 100
}
```
- Reduces subscription price by X%
- Applied at Stripe Checkout
- Tracked in transaction metadata

### **Free Access Codes**
```typescript
{
  code: "EARLYACCESS",
  free_access: true,
  free_duration_days: 90, // or NULL for lifetime
  max_uses: 100
}
```
- Grants free subscription
- No Stripe payment required
- Duration-limited or lifetime
- Recorded in subscriptions table

### **Sample Codes** (Seeded in Migration)
- `WELCOME10` - 10% off (100 uses)
- `SAVE20` - 20% off (50 uses)
- `FREE30` - 30-day trial (1000 uses)
- `EARLYACCESS` - 90-day free access (100 uses)
- `LIFETIME` - Lifetime free access (10 uses)

---

## 🔐 Security

### **RLS Policies**

**Subscriptions:**
- Users see their own
- Admins see all
- Service role can update (webhook)

**Promo Codes:**
- Admins full CRUD
- Users can read active codes (for validation)

**Transactions:**
- Users see their own
- Admins see all
- Service role can insert (webhook)

### **Webhook Security**
- Signature verification with `STRIPE_WEBHOOK_SECRET`
- Validates event authenticity
- Prevents replay attacks

### **Environment Variables**
- Secret keys only in backend (Supabase Functions)
- Public keys only in frontend
- Never commit `.env` files to git

---

## 🧪 Testing

### **Test Cards** (Stripe Test Mode)

**Successful payment:**
```
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Payment fails:**
```
Card: 4000 0000 0000 0002
```

**Requires authentication (3D Secure):**
```
Card: 4000 0027 6000 3184
```

### **Manual Testing Flow**

1. **Free Trial via Promo Code:**
   - Go to `/subscribe?plan=standard`
   - Enter `EARLYACCESS`
   - Click "Apply"
   - See "Free Access" badge
   - Click "Activate Free Access"
   - Check `/billing` shows active subscription

2. **Discount Code:**
   - Go to `/subscribe?plan=standard`
   - Enter `SAVE20`
   - Click "Apply"
   - See price reduced by 20%
   - Complete Stripe checkout (test card)
   - Check webhook updates subscription

3. **Admin Promo Management:**
   - Go to `/admin/promo-codes`
   - Click "Create Promo Code"
   - Use random code generator
   - Set 50% discount
   - Save and copy code
   - Test redemption

---

## 🔧 Troubleshooting

### **"Access Denied" to Admin Promo Page**
**Fix:** Ensure you have admin role (see ADMIN_SETUP_QUERIES.sql)

### **Promo Code "Invalid"**
**Causes:**
- Code expired
- Usage limit reached
- Code deactivated
- Typo in code

**Debug:**
```sql
SELECT * FROM public.promo_codes WHERE UPPER(code) = 'YOURCODE';
```

### **Subscription Not Updating After Payment**
**Causes:**
- Webhook not configured
- Webhook signing secret mismatch
- Edge function error

**Debug:**
1. Check Supabase Function logs
2. Check Stripe webhook delivery status
3. Verify environment variables

### **Checkout Session Not Creating**
**Causes:**
- Invalid price ID
- Missing Stripe secret key
- Edge function not deployed

**Debug:**
```bash
# Check function status
npx supabase functions list

# View function logs
npx supabase functions logs create-checkout-session
```

---

## 📊 Database Queries

### **Check Subscription Status**
```sql
SELECT 
  u.email,
  s.plan,
  s.status,
  s.current_period_end,
  s.cancel_at_period_end
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
WHERE u.email = 'user@example.com';
```

### **View Promo Code Usage**
```sql
SELECT 
  pc.code,
  pc.used_count,
  pc.max_uses,
  COUNT(pr.id) as redemptions
FROM public.promo_codes pc
LEFT JOIN public.promo_redemptions pr ON pc.id = pr.promo_code_id
GROUP BY pc.id, pc.code, pc.used_count, pc.max_uses
ORDER BY pc.created_at DESC;
```

### **Billing History for User**
```sql
SELECT 
  t.created_at,
  t.amount_cents / 100.0 as amount_dollars,
  t.plan,
  t.status,
  pc.code as promo_code
FROM public.transactions t
LEFT JOIN public.promo_codes pc ON t.promo_code_id = pc.id
WHERE t.user_id = 'user-id-here'
ORDER BY t.created_at DESC;
```

---

## 🎨 UI Components Used

### **Pages:**
- `Pricing.tsx` - Pricing tier comparison
- `Subscribe.tsx` - Checkout with promo input
- `Billing.tsx` - Account and billing history
- `admin/PromoCodes.tsx` - Admin promo management

### **Components:**
- `SubscriptionGuard.tsx` - Route protection
- `AdminLayout.tsx` - Admin sidebar (extended)
- `DataTable.tsx` - Promo codes table

### **Libraries:**
- **Stripe** - Payment processing
- **date-fns** - Date formatting
- **shadcn/ui** - UI components

---

## 🚀 Deployment

### **Environment Variables (Production)**

```env
# Frontend (.env.production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_STANDARD=price_live_...
VITE_STRIPE_PRICE_PRO=price_live_...
VITE_APP_URL=https://your-domain.com

# Backend (Supabase Dashboard → Settings → Secrets)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STANDARD=price_live_...
STRIPE_PRICE_PRO=price_live_...
APP_URL=https://your-domain.com
```

### **Deployment Checklist**

- [ ] Create Stripe products with live prices
- [ ] Deploy Supabase Edge Functions
- [ ] Configure Stripe webhook with production URL
- [ ] Set all environment variables
- [ ] Run database migration in production
- [ ] Test subscription flow end-to-end
- [ ] Create initial promo codes
- [ ] Train admins on promo management

---

## 💰 Pricing Tiers

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 10 assessments/mo, basic reporting, single user |
| **Standard** | $29/mo | Unlimited assessments, voice-to-text, up to 5 supervisors |
| **Pro** | $99/mo | Unlimited supervisors, EPA import, admin console, API access |

---

## 📝 Promo Code Examples

### **Create 10% Welcome Code:**
```sql
INSERT INTO public.promo_codes (code, description, discount_percent, max_uses)
VALUES ('WELCOME10', '10% off for new users', 10, 1000);
```

### **Create Free Trial Code:**
```sql
INSERT INTO public.promo_codes (
  code, description, free_access, free_duration_days, max_uses
)
VALUES (
  'TRIAL30', '30-day free trial', true, 30, 500
);
```

### **Create Lifetime Access Code:**
```sql
INSERT INTO public.promo_codes (
  code, description, free_access, free_duration_days, max_uses
)
VALUES (
  'VIPACCESS', 'Lifetime VIP access', true, NULL, 10
);
```

---

## 🔄 User Workflows

### **New User Signup → Free Trial**
1. User signs up (`/auth`)
2. Auto-assigned free plan
3. Can use limited features
4. Prompted to upgrade on `/pricing`

### **Paid Subscription Flow**
1. User visits `/pricing`
2. Clicks "Upgrade Now"
3. Redirected to `/subscribe?plan=standard`
4. (Optional) Enters promo code
5. Clicks "Proceed to Checkout"
6. Stripe Checkout modal
7. Completes payment
8. Webhook updates subscription
9. Redirected to `/dashboard` with success message

### **Free Access via Promo**
1. User visits `/subscribe?plan=standard`
2. Enters promo code (e.g., `EARLYACCESS`)
3. Clicks "Apply"
4. Sees "Free Access" confirmation
5. Clicks "Activate Free Access"
6. Subscription activated immediately (no Stripe)
7. Redirected to `/dashboard`

---

## 🛡️ Subscription Guards

### **How to Protect Routes**

```typescript
import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';

// Wrap protected routes
<SubscriptionGuard requiredPlan="standard">
  <YourProtectedComponent />
</SubscriptionGuard>

// Or in route definition:
<Route 
  path="/premium-feature" 
  element={
    <SubscriptionGuard requiredPlan="pro">
      <PremiumFeature />
    </SubscriptionGuard>
  } 
/>
```

### **Plan Hierarchy**
- `free` < `standard` < `pro` < `enterprise`
- Higher plans include all lower plan features
- Guards check if user plan >= required plan

---

## 🎛️ Admin Features

### **Promo Code Management** (`/admin/promo-codes`)

**Create Promo Code:**
1. Click "Create Promo Code"
2. Enter code or use random generator
3. Choose:
   - **Discount:** Set percentage (0-100%)
   - **Free Access:** Grant free subscription (with duration)
4. Set max uses
5. Set expiration date (optional)
6. Toggle active status
7. Save

**Track Usage:**
- See used_count vs. max_uses
- View expiration status
- Monitor active/inactive codes
- Stats dashboard shows totals

**Edit/Delete:**
- Edit existing codes (change limits, expiration)
- Delete unused codes
- Deactivate codes (soft delete)

---

## 📈 Analytics

### **Subscription Stats**
```sql
-- Total subscriptions by plan
SELECT plan, COUNT(*) 
FROM public.subscriptions 
GROUP BY plan;

-- Active subscriptions
SELECT COUNT(*) 
FROM public.subscriptions 
WHERE status IN ('active', 'trialing');

-- Revenue (last 30 days)
SELECT 
  SUM(amount_cents) / 100.0 as total_revenue_usd
FROM public.transactions
WHERE status = 'completed'
  AND created_at > now() - interval '30 days';
```

### **Promo Code Analytics**
```sql
-- Most used promo codes
SELECT 
  code,
  used_count,
  max_uses,
  (used_count::float / max_uses) * 100 as usage_percent
FROM public.promo_codes
ORDER BY used_count DESC
LIMIT 10;

-- Promo code redemptions this month
SELECT COUNT(*) 
FROM public.promo_redemptions
WHERE redeemed_at > date_trunc('month', now());
```

---

## 🐛 Common Issues

### **Issue:** Webhook not firing
**Solution:**
1. Check webhook URL in Stripe Dashboard
2. Verify signing secret in environment variables
3. Check Supabase Function logs
4. Test webhook with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

### **Issue:** Promo code not applying discount
**Solution:**
1. Verify code is active (`is_active = true`)
2. Check usage limit not reached
3. Ensure not expired
4. Check validation function logs

### **Issue:** Subscription not granting access
**Solution:**
1. Check subscription status is 'active'
2. Verify current_period_end is in future
3. Check RLS policies
4. Reload page to refresh auth state

---

## 📚 File Structure

```
Pages:
├── Pricing.tsx              # Pricing tier comparison
├── Subscribe.tsx            # Checkout with promo input
├── Billing.tsx              # Billing history
└── admin/PromoCodes.tsx     # Admin promo management

Components:
└── subscription/
    └── SubscriptionGuard.tsx  # Route protection

Utilities:
└── lib/subscription.ts      # Subscription helpers

Supabase Functions:
├── create-checkout-session/  # Stripe Checkout creation
└── stripe-webhook/           # Webhook event handler

Migrations:
└── 20251103_paywall_promo_system.sql

Documentation:
├── PAYWALL_SETUP_GUIDE.md (this file)
└── .env.example (to create)
```

---

## 💡 Best Practices

### **Promo Codes:**
1. **Short & memorable:** 6-12 characters
2. **Uppercase:** Easier to read and type
3. **Avoid ambiguous:** No O/0, I/1, etc.
4. **Set limits:** Prevent abuse with max_uses
5. **Track usage:** Monitor redemption rates
6. **Expire codes:** Time-limited campaigns

### **Subscription Management:**
1. **Grace periods:** Allow 3-day past_due before blocking
2. **Soft limits:** Warn before hard-blocking access
3. **Clear messaging:** Explain why upgrade needed
4. **Easy upgrades:** One-click from guard screen
5. **Audit trail:** Log all subscription changes

### **Testing:**
1. **Use test mode:** Always test in Stripe test mode first
2. **Test all flows:** Free, discount, full price
3. **Test webhooks:** Use Stripe CLI for local testing
4. **Test edge cases:** Expired codes, usage limits
5. **Test guards:** Verify route protection works

---

## 🎊 **Summary**

**What's Built:**
- ✅ Complete database schema (4 tables)
- ✅ Stripe Checkout integration
- ✅ Webhook handling (5 event types)
- ✅ Promo code system (discount + free access)
- ✅ Admin promo management
- ✅ Subscription guards
- ✅ Billing history
- ✅ Pricing page
- ✅ Full audit logging

**Stripe Test Cards:** Use 4242 4242 4242 4242  
**Sample Promo Codes:** EARLYACCESS, SAVE20, WELCOME10

**Ready for production deployment!** 🚀

---

*Last Updated: November 2, 2025*


