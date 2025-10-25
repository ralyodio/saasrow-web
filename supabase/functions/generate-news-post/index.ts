import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const adminEmail = Deno.env.get('ADMIN_EMAIL')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (user.email !== adminEmail) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Received request, parsing body...');
    const { topic } = await req.json();
    console.log('Topic received:', topic);

    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI key present:', !!openAIKey);

    if (!openAIKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Generating content for topic:', topic);
    const prompt = `Write a detailed, professional blog post about: ${topic}

The post should be about software, technology, productivity, or SaaS-related topics.

Return a JSON object with:
- title: A compelling title (50-80 characters)
- excerpt: A brief summary (120-160 characters)
- content: Full HTML content with proper <h2>, <p>, <ul>, <li> tags. Include 3-5 sections with descriptive headings.

Make the content informative, engaging, and at least 500 words. Use proper HTML formatting but NO markdown.`;

    console.log('Calling OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional tech writer specializing in software and SaaS content. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      }),
    });

    console.log('OpenAI response status:', openAIResponse.status);

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate content' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Parsing OpenAI response...');
    const openAIData = await openAIResponse.json();
    console.log('OpenAI data received, parsing content...');
    const generatedContent = JSON.parse(openAIData.choices[0].message.content);
    console.log('Generated content:', generatedContent.title);

    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);

    console.log('Saving to database...');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: newsPost, error: dbError } = await supabase
      .from('news_posts')
      .insert({
        slug: slug + '-' + Date.now(),
        title: generatedContent.title,
        excerpt: generatedContent.excerpt,
        content: generatedContent.content,
        published: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError, dbError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to save post' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Success! Returning news post:', newsPost.id);
    return new Response(
      JSON.stringify(newsPost),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error, error.message, error.stack);
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