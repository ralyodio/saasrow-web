import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'PATCH') {
      const { id, published } = await req.json();

      if (!id || typeof published !== 'boolean') {
        return new Response(
          JSON.stringify({ error: 'ID and published status are required' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const { data, error } = await supabase
        .from('news_posts')
        .update({ published })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update post:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update post' }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return new Response(
        JSON.stringify(data),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID is required' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const { error } = await supabase
        .from('news_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete post:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete post' }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});