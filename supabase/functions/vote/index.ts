import { createClient } from 'npm:@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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

    const { data: existingVote, error: fetchError } = await supabaseClient
      .from('votes')
      .select('*')
      .eq('submission_id', submissionId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    let result

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
        })

      if (insertError) throw insertError

      result = { action: 'created', voteType }
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
