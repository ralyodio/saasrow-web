import { createClient } from 'npm:@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data, error } = await supabase
      .from('admin_tokens')
      .select('email, expires_at, used')
      .eq('token', token)
      .maybeSingle()

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin token', valid: false }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (data.used) {
      return new Response(
        JSON.stringify({ error: 'This login link has already been used', valid: false }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (new Date(data.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This login link has expired', valid: false }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { error: updateError } = await supabase
      .from('admin_tokens')
      .update({ used: true })
      .eq('token', token)

    if (updateError) {
      console.error('Error marking token as used:', updateError)
    }

    return new Response(
      JSON.stringify({
        valid: true,
        email: data.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, valid: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})