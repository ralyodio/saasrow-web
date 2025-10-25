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
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const submissionId = url.searchParams.get('submissionId')

    if (!token || !submissionId) {
      return new Response(
        JSON.stringify({ error: 'token and submissionId are required' }),
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

    const { data: userToken, error: tokenError } = await supabase
      .from('user_tokens')
      .select('email, tier')
      .eq('token', token)
      .maybeSingle()

    if (tokenError || !userToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: submission, error: submissionError } = await supabase
      .from('software_submissions')
      .select('id, email, tier, view_count')
      .eq('id', submissionId)
      .maybeSingle()

    if (submissionError || !submission || submission.email !== userToken.email) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized or submission not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: dailyStats, error: statsError } = await supabase
      .from('submission_analytics_daily')
      .select('date, views, clicks, unique_visitors')
      .eq('submission_id', submissionId)
      .gte('date', thirtyDaysAgoStr)
      .order('date', { ascending: true })

    if (statsError) {
      console.error('Error fetching stats:', statsError)
    }

    const { data: recentClicks, error: clicksError } = await supabase
      .from('submission_clicks')
      .select('clicked_at, referrer')
      .eq('submission_id', submissionId)
      .gte('clicked_at', thirtyDaysAgo.toISOString())
      .order('clicked_at', { ascending: false })
      .limit(100)

    if (clicksError) {
      console.error('Error fetching clicks:', clicksError)
    }

    const totalViews = submission.view_count || 0
    const totalClicks = dailyStats?.reduce((sum, day) => sum + day.clicks, 0) || 0
    const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0

    const response = {
      tier: userToken.tier || submission.tier || 'basic',
      totalViews,
      totalClicks,
      clickThroughRate: parseFloat(clickThroughRate.toFixed(2)),
      dailyStats: dailyStats || [],
      recentClicks: recentClicks || [],
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get analytics error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
