import { createClient } from 'npm:@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

function getClientIp(req: Request): string | null {
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  const xForwardedFor = req.headers.get('x-forwarded-for')
  const xRealIp = req.headers.get('x-real-ip')

  if (cfConnectingIp) return cfConnectingIp
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim()
  if (xRealIp) return xRealIp

  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
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
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    const { submissionId, voteType } = await req.json()

    if (!submissionId || !voteType || !['upvote', 'downvote'].includes(voteType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: submissionId and voteType (upvote/downvote) required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    let result
    const isAuthenticated = !!user

    if (isAuthenticated) {
      const { data: existingVote, error: fetchError } = await supabaseClient
        .from('votes')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) {
        throw fetchError
      }

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          const { error: deleteError } = await supabaseClient
            .from('votes')
            .delete()
            .eq('id', existingVote.id)

          if (deleteError) throw deleteError

          result = { action: 'removed', voteType: null }
        } else {
          const { error: updateError } = await supabaseClient
            .from('votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id)

          if (updateError) throw updateError

          result = { action: 'updated', voteType }
        }
      } else {
        const { error: insertError } = await supabaseClient
          .from('votes')
          .insert({
            submission_id: submissionId,
            user_id: user.id,
            vote_type: voteType,
            is_anonymous: false,
          })

        if (insertError) throw insertError

        result = { action: 'created', voteType }
      }
    } else {
      const ipAddress = getClientIp(req)

      if (!ipAddress) {
        return new Response(
          JSON.stringify({ error: 'Could not determine IP address' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { data: existingVote, error: fetchError } = await supabaseClient
        .from('votes')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('ip_address', ipAddress)
        .is('user_id', null)
        .maybeSingle()

      if (fetchError) {
        throw fetchError
      }

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          const supabaseService = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          )

          const { error: deleteError } = await supabaseService
            .from('votes')
            .delete()
            .eq('id', existingVote.id)

          if (deleteError) throw deleteError

          result = { action: 'removed', voteType: null }
        } else {
          const supabaseService = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          )

          const { error: updateError } = await supabaseService
            .from('votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id)

          if (updateError) throw updateError

          result = { action: 'updated', voteType }
        }
      } else {
        const { error: insertError } = await supabaseClient
          .from('votes')
          .insert({
            submission_id: submissionId,
            user_id: null,
            ip_address: ipAddress,
            vote_type: voteType,
            is_anonymous: true,
          })

        if (insertError) throw insertError

        result = { action: 'created', voteType }
      }
    }

    const { data: submission, error: submissionError } = await supabaseClient
      .from('software_submissions')
      .select('upvotes, downvotes')
      .eq('id', submissionId)
      .single()

    if (submissionError) throw submissionError

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        upvotes: submission.upvotes,
        downvotes: submission.downvotes,
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
