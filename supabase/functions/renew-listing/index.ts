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
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { submissionId, token } = await req.json()

    if (!submissionId || !token) {
      return new Response(
        JSON.stringify({ error: 'Submission ID and token are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify token and get email
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('email')
      .eq('token', token)
      .maybeSingle()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify submission belongs to this user
    const { data: submission, error: submissionError } = await supabase
      .from('software_submissions')
      .select('id, email, tier, status, expires_at')
      .eq('id', submissionId)
      .eq('email', tokenData.email)
      .maybeSingle()

    if (submissionError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Only free tier can be renewed
    if (submission.tier && submission.tier !== 'free') {
      return new Response(
        JSON.stringify({ error: 'Only free tier listings can be renewed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Renew the listing
    const { error: renewError } = await supabase
      .from('software_submissions')
      .update({
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        last_renewed_at: new Date().toISOString(),
        renewal_count: (submission.renewal_count || 0) + 1,
        status: 'approved', // Re-approve if expired
      })
      .eq('id', submissionId)

    if (renewError) {
      console.error('Error renewing listing:', renewError)
      throw renewError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Listing renewed for 90 days',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in renew-listing:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})