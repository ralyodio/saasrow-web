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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userToken } = await supabase
      .from('user_tokens')
      .select('email')
      .eq('token', token)
      .maybeSingle()

    if (!userToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: submissions } = await supabase
      .from('software_submissions')
      .select('stripe_payment_id')
      .eq('email', userToken.email)
      .not('stripe_payment_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!submissions?.stripe_payment_id) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: subscription } = await supabase
      .from('stripe_subscriptions')
      .select('subscription_id, status')
      .eq('customer_id', submissions.stripe_payment_id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (!subscription?.subscription_id) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const cancelResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.subscription_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    if (!cancelResponse.ok) {
      const error = await cancelResponse.text()
      console.error('Stripe cancellation error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to cancel subscription' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    await supabase
      .from('stripe_subscriptions')
      .update({ status: 'canceled' })
      .eq('subscription_id', subscription.subscription_id)

    return new Response(
      JSON.stringify({
        message: 'Subscription cancelled successfully',
        success: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})