#!/bin/bash
# Generate TypeScript types from Supabase schema
# This script uses the Supabase Management API

PROJECT_ID="sxaavsmcpnmztbrulfoy"
OUTPUT_FILE="src/integrations/supabase/types.ts"

echo "Generating TypeScript types for Supabase project: $PROJECT_ID"

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN environment variable is not set."
  echo ""
  echo "To get your access token:"
  echo "1. Go to https://supabase.com/dashboard/account/tokens"
  echo "2. Create a new access token"
  echo "3. Run: export SUPABASE_ACCESS_TOKEN=your_token_here"
  echo "4. Then run this script again"
  exit 1
fi

# Use Supabase CLI if available, otherwise use curl
if command -v supabase &> /dev/null; then
  supabase gen types typescript --project-id "$PROJECT_ID" --schema public > "$OUTPUT_FILE"
else
  echo "Supabase CLI not found. Please install it or use the Dashboard method."
  exit 1
fi

echo "Types generated successfully at: $OUTPUT_FILE"

