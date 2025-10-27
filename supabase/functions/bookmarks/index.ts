import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userEmail = user.email;

    if (req.method === "GET") {
      const url = new URL(req.url);
      const submissionId = url.searchParams.get("submission_id");

      if (submissionId) {
        const { data, error } = await supabase
          .from("bookmarks")
          .select("*")
          .eq("user_email", userEmail)
          .eq("submission_id", submissionId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({ isBookmarked: !!data, bookmark: data }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        const { data, error } = await supabase
          .from("bookmarks")
          .select(`
            *,
            software_submissions:submission_id (
              id,
              name,
              tagline,
              website_url,
              logo_url,
              category,
              tier,
              upvotes,
              downvotes
            )
          `)
          .eq("user_email", userEmail)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({ bookmarks: data }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (req.method === "POST") {
      const { submission_id } = await req.json();

      if (!submission_id) {
        return new Response(
          JSON.stringify({ error: "submission_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data, error } = await supabase
        .from("bookmarks")
        .insert({
          user_email: userEmail,
          submission_id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return new Response(
            JSON.stringify({ error: "Already bookmarked" }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, bookmark: data }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const submissionId = url.searchParams.get("submission_id");

      if (!submissionId) {
        return new Response(
          JSON.stringify({ error: "submission_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_email", userEmail)
        .eq("submission_id", submissionId);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in bookmarks function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});