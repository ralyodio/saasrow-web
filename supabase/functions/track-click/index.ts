import { createClient } from 'npm:@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface TrackClickRequest {
  submissionId: string
  referrer?: string
  userAgent?: string
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
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

    const { submissionId, referrer, userAgent }: TrackClickRequest = await req.json()

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: 'submissionId is required' }),
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

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const ipHash = await hashString(clientIp)

    const { error: clickError } = await supabase
      .from('submission_clicks')
      .insert({
        submission_id: submissionId,
        referrer: referrer || null,
        user_agent: userAgent || null,
        ip_hash: ipHash,
      })

    if (clickError) {
      console.error('Error tracking click:', clickError)
      return new Response(
        JSON.stringify({ error: clickError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const today = new Date().toISOString().split('T')[0]

    const { data: existingRecord } = await supabase
      .from('submission_analytics_daily')
      .select('*')
      .eq('submission_id', submissionId)
      .eq('date', today)
      .maybeSingle()

    if (existingRecord) {
      await supabase
        .from('submission_analytics_daily')
        .update({
          clicks: existingRecord.clicks + 1,
        })
        .eq('id', existingRecord.id)
    } else {
      await supabase
        .from('submission_analytics_daily')
        .insert({
          submission_id: submissionId,
          date: today,
          clicks: 1,
          views: 0,
          unique_visitors: 0,
        })
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Track click error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
