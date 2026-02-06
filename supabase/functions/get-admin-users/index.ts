import { createClient } from 'npm:@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    const { data: submissions, error: submissionsError } = await supabase
      .from('software_submissions')
      .select(`
        id,
        tier,
        created_at,
        submitted_at,
        submission_contacts!inner(email)
      `)
      .order('created_at', { ascending: false })

    if (submissionsError) throw submissionsError

    const { data: tokens, error: tokensError } = await supabase
      .from('user_tokens')
      .select('*')
      .order('created_at', { ascending: false })

    if (tokensError) throw tokensError

    const { data: subscriptions, error: subsError } = await supabase
      .from('stripe_subscriptions')
      .select('customer_id, status, current_period_end, cancel_at_period_end, email')
      .is('deleted_at', null)

    if (subsError) throw subsError

    return new Response(
      JSON.stringify({
        submissions: submissions || [],
        tokens: tokens || [],
        subscriptions: subscriptions || []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
