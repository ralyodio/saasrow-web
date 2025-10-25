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
      .select('email, tier, created_at, expires_at')
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

    let subscriptionInfo = null
    let billingHistory = []

    if (submissions?.stripe_payment_id) {
      const { data: subscription } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('customer_id', submissions.stripe_payment_id)
        .maybeSingle()

      if (subscription) {
        subscriptionInfo = {
          tier: userToken.tier,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          paymentMethodBrand: subscription.payment_method_brand,
          paymentMethodLast4: subscription.payment_method_last4,
        }
      }

      const { data: orders } = await supabase
        .from('stripe_orders')
        .select('*')
        .eq('customer_id', submissions.stripe_payment_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (orders) {
        billingHistory = orders.map(order => ({
          id: order.id,
          amount: order.amount_total,
          currency: order.currency,
          status: order.payment_status,
          createdAt: order.created_at,
        }))
      }
    }

    return new Response(
      JSON.stringify({
        tier: userToken.tier,
        subscription: subscriptionInfo,
        billingHistory,
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