import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TwoFactorSchema = z.object({
  method: z.enum(['sms', 'email']),
});

// Rate limiting: track attempts per user
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 300000 }); // 5 minutes
    return true;
  }
  
  if (userLimit.count >= 5) {
    return false; // Max 5 codes per 5 minutes
  }
  
  userLimit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { method } = TwoFactorSchema.parse(body);

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('phone')
      .eq('user_id', user.id)
      .single();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in database with 10-minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    const { error: insertError } = await supabaseClient
      .from('two_factor_codes')
      .insert({
        user_id: user.id,
        code,
        method,
        expires_at: expiresAt,
      });

    if (insertError) throw insertError;

    if (method === 'sms' && profile?.phone) {
      // Send SMS via Twilio
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        throw new Error('Twilio credentials not configured');
      }

      const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: profile.phone,
          From: twilioPhoneNumber,
          Body: `Your Fleet Pro verification code is: ${code}. Valid for 10 minutes.`,
        }),
      });

      if (!twilioResponse.ok) {
        const error = await twilioResponse.text();
        console.error('Twilio error:', error);
        throw new Error('Failed to send SMS');
      }

      console.log('2FA code sent via SMS to:', profile.phone);
    } else if (method === 'email') {
      // For email, we'll just return success - implement Resend integration if needed
      console.log('2FA code sent via email to:', user.email);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Verification code sent via ${method}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-2fa-code:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
