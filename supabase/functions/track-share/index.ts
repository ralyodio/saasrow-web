import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ShareRequest {
  submissionId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { submissionId }: ShareRequest = await req.json();

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: 'submissionId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: submission, error: fetchError } = await supabase
      .from('software_submissions')
      .select('share_count, last_share_reset')
      .eq('id', submissionId)
      .maybeSingle();

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const now = new Date();
    const lastReset = new Date(submission.last_share_reset);
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    let newShareCount = (submission.share_count || 0) + 1;
    let lastShareReset = submission.last_share_reset;

    if (hoursSinceReset >= 24) {
      newShareCount = 1;
      lastShareReset = now.toISOString();
    }

    const { error: updateError } = await supabase
      .from('software_submissions')
      .update({
        share_count: newShareCount,
        last_share_reset: lastShareReset,
      })
      .eq('id', submissionId);

    if (updateError) {
      throw updateError;
    }

    const isTrending = newShareCount >= 10 && hoursSinceReset < 24;

    return new Response(
      JSON.stringify({
        success: true,
        shareCount: newShareCount,
        isTrending,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error tracking share:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to track share' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});