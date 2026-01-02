import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the current user to check permissions
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is supervisor or admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      throw new Error('Failed to check permissions');
    }

    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes('supervisor') && !userRoles.includes('admin')) {
      throw new Error('Permission denied. Only supervisors and admins can invite students.');
    }

    // Parse request body
    const { email, full_name, institution_id } = await req.json();

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Valid email is required');
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (existingUser?.user) {
      // User exists - check if profile exists
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', existingUser.user.id)
        .single();

      if (profile) {
        // Profile exists - ensure student role
        await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: existingUser.user.id,
            role: 'student'
          }, {
            onConflict: 'user_id,role'
          });

        // Update institution if provided
        if (institution_id) {
          await supabaseAdmin
            .from('profiles')
            .update({ institution_id })
            .eq('id', existingUser.user.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Student account already exists. Role assigned if needed.',
            student_id: existingUser.user.id,
            invited: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // User exists but no profile - create profile
        await supabaseAdmin
          .from('profiles')
          .insert({
            id: existingUser.user.id,
            email: email.toLowerCase().trim(),
            full_name: full_name || null,
            institution_id: institution_id || null
          });

        await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: existingUser.user.id,
            role: 'student'
          }, {
            onConflict: 'user_id,role'
          });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Student account created successfully.',
            student_id: existingUser.user.id,
            invited: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // User doesn't exist - send invitation
    // Construct redirect URL - try to get from request, otherwise use default
    let redirectUrl = `${supabaseUrl.replace('.supabase.co', '')}/auth/v1/callback`;
    try {
      const referer = req.headers.get('referer');
      if (referer) {
        const url = new URL(referer);
        redirectUrl = `${url.origin}/auth`;
      }
    } catch {
      // Use default if parsing fails
    }
    
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        data: {
          full_name: full_name || null,
          role: 'student',
          institution_id: institution_id || null
        },
        redirectTo: redirectUrl
      }
    );

    if (inviteError) {
      throw new Error(`Failed to send invitation: ${inviteError.message}`);
    }

    if (!inviteData?.user) {
      throw new Error('Failed to create invitation');
    }

    // Create profile for invited user (will be updated when they accept)
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: inviteData.user.id,
        email: email.toLowerCase().trim(),
        full_name: full_name || null,
        institution_id: institution_id || null
      }, {
        onConflict: 'id'
      });

    // Assign student role
    await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: inviteData.user.id,
        role: 'student'
      }, {
        onConflict: 'user_id,role'
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully. The student will receive an email to complete their account setup.',
        student_id: inviteData.user.id,
        invited: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in invite-student function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

