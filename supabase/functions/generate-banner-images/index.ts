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
    const adminEmail = Deno.env.get('ADMIN_EMAIL')!;

    const { title, email } = await req.json();

    if (!email || email !== adminEmail) {
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

    if (!title || typeof title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
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

    const imagePrompts = [
      `A modern, professional banner image for a tech blog post about: ${title}. Clean design, technology theme, minimalist style, 16:9 aspect ratio`,
      `An abstract, colorful banner representing: ${title}. Modern design, gradient colors, professional look, suitable for a tech blog, 16:9 format`,
      `A sleek banner image with geometric shapes and tech elements for article: ${title}. Contemporary style, blue and neutral tones, 16:9 aspect ratio`
    ];

    const imageUrls: string[] = [];

    for (const prompt of imagePrompts) {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error for prompt:', prompt, response.status);
        continue;
      }

      const data = await response.json();
      if (data.data && data.data[0] && data.data[0].url) {
        const imageUrl = data.data[0].url;
        
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.arrayBuffer();
        
        const fileName = `${crypto.randomUUID()}.png`;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('news-banners')
          .upload(fileName, imageBlob, {
            contentType: 'image/png',
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('news-banners')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }
    }

    if (imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate any images' }),
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
      JSON.stringify({ images: imageUrls }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
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
