# Deploy Invite Student Edge Function

## Quick Deploy (Supabase CLI)

```bash
# Make sure you're in the project root
cd pd-assess-plus

# Deploy the function
supabase functions deploy invite-student

# Or if using Supabase CLI with project link
supabase functions deploy invite-student --project-ref your-project-ref
```

## Manual Deploy (Supabase Dashboard)

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** (left sidebar)
3. Click **Create a new function**
4. Name it: `invite-student`
5. Copy the entire contents of: `supabase/functions/invite-student/index.ts`
6. Paste into the function editor
7. Click **Deploy**

## Verify Deployment

After deploying, test the function:

```bash
# Using Supabase CLI
supabase functions invoke invite-student --body '{"email":"test@example.com","full_name":"Test User"}'
```

Or test in the Dashboard:
1. Go to Edge Functions → `invite-student`
2. Click **Invoke function**
3. Use this test payload:
```json
{
  "email": "test@example.com",
  "full_name": "Test User",
  "institution_id": null
}
```

## Environment Variables

Make sure these are set in your Supabase project:
- `SUPABASE_URL` - Automatically set
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically set (from Settings → API)

## Troubleshooting

### "Function not found" error
- Ensure the function is deployed
- Check the function name matches exactly: `invite-student`
- Wait a few seconds after deployment for propagation

### "Permission denied" error
- Ensure the user calling the function has `supervisor` or `admin` role
- Check that the Authorization header is being sent correctly

### "Failed to send invitation" error
- Check Supabase email settings (Settings → Auth → Email)
- Ensure SMTP is configured or use Supabase's built-in email service
- Check email templates are set up

