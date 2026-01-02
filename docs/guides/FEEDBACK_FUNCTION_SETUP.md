# Smart Feedback Assistant - Edge Function Setup

## Issue: 500 Error from analyze-feedback Function

The `analyze-feedback` Edge Function is returning a 500 error, which typically means:

1. **Missing `OPENAI_API_KEY` secret** in Supabase Edge Functions
2. **Invalid OpenAI API key**
3. **OpenAI API quota exceeded or account issue**

## Solution: Configure OpenAI API Key

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **Important**: Save it immediately - you won't be able to see it again!

### Step 2: Set the Secret in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (`sxaavsmcpnmztbrulfoy`)
3. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
4. Click **Add new secret**
5. Enter:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (e.g., `sk-...`)
6. Click **Save**

### Step 3: Verify the Function is Deployed

1. In Supabase Dashboard, go to **Edge Functions**
2. Verify that `analyze-feedback` appears in the list
3. If it's not there, deploy it using:

```bash
cd "/Users/howardritz/Documents/App Dev/pd-assess-plus"
export PATH="$HOME/.local/bin:$PATH"
supabase login
supabase functions deploy analyze-feedback --project-ref sxaavsmcpnmztbrulfoy
```

### Step 4: Test the Function

1. Try using the "Improve Feedback" button in the app
2. Check the browser console for any errors
3. If you still see a 500 error, check the Edge Function logs:
   - In Supabase Dashboard → **Edge Functions** → **analyze-feedback** → **Logs**
   - Look for error messages that indicate what went wrong

## Troubleshooting

### Error: "OPENAI_API_KEY not configured"
- **Solution**: Make sure you've added the secret in Supabase Dashboard (Step 2 above)
- **Note**: Secrets are case-sensitive - use exactly `OPENAI_API_KEY`

### Error: "OpenAI API error: Invalid API key"
- **Solution**: Your API key is invalid or expired. Generate a new one from OpenAI

### Error: "OpenAI API error: Insufficient quota"
- **Solution**: Your OpenAI account has run out of credits. Add credits at https://platform.openai.com/account/billing

### Error: "Failed to send request to Edge Function"
- **Solution**: The function may not be deployed. Deploy it using the command in Step 3

### Still having issues?

1. Check Edge Function logs in Supabase Dashboard
2. Verify the function code is correct (should be in `supabase/functions/analyze-feedback/index.ts`)
3. Make sure you're using the correct project reference (`sxaavsmcpnmztbrulfoy`)

## Cost Considerations

The Smart Feedback Assistant uses OpenAI's `gpt-4o-mini` model, which is cost-effective:
- **Cost**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Typical feedback analysis**: ~500-1000 tokens per request
- **Estimated cost**: ~$0.001-0.002 per feedback analysis

You can monitor usage at https://platform.openai.com/usage

