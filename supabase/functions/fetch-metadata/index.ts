import { createClient } from 'npm:@supabase/supabase-js@2.76.1'
import { OpenAI } from 'npm:openai@4.47.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface MetaData {
  title?: string
  description?: string
  image?: string
  favicon?: string
}

async function fetchUrlMetadata(url: string): Promise<MetaData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WireSniff/1.0)',
      },
    })

    if (!response.ok) {
      return {}
    }

    const html = await response.text()
    const metadata: MetaData = {}

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      metadata.title = titleMatch[1].trim()
    }

    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    if (ogTitleMatch) {
      metadata.title = ogTitleMatch[1].trim()
    }

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    if (descMatch) {
      metadata.description = descMatch[1].trim()
    }

    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    if (ogDescMatch) {
      metadata.description = ogDescMatch[1].trim()
    }

    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    if (ogImageMatch) {
      metadata.image = ogImageMatch[1].trim()
    }

    const urlObj = new URL(url)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`

    const pngIconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*type=["']image\/png["'][^>]*href=["']([^"']+)["']/i) ||
                         html.match(/<link[^>]*type=["']image\/png["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i) ||
                         html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+\.png[^"']*)["']/i)

    if (pngIconMatch) {
      let favicon = pngIconMatch[1].trim()
      if (!favicon.startsWith('http')) {
        favicon = favicon.startsWith('/') ? `${baseUrl}${favicon}` : `${baseUrl}/${favicon}`
      }
      metadata.favicon = favicon
    } else {
      const anyIconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i)
      if (anyIconMatch) {
        let favicon = anyIconMatch[1].trim()
        if (!favicon.startsWith('http')) {
          favicon = favicon.startsWith('/') ? `${baseUrl}${favicon}` : `${baseUrl}/${favicon}`
        }
        metadata.favicon = favicon
      } else {
        metadata.favicon = `${baseUrl}/favicon.ico`
      }
    }

    return metadata
  } catch (error) {
    console.error('Error fetching metadata:', error)
    return {}
  }
}

async function generateWithAI(url: string, metadata: MetaData): Promise<{ title: string; description: string; category: string }> {
  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  })

  const existingInfo = `
URL: ${url}
${metadata.title ? `Existing Title: ${metadata.title}` : ''}
${metadata.description ? `Existing Description: ${metadata.description}` : ''}
`.trim()

  const prompt = `You are analyzing a website for a software directory. Based on the following information:

${existingInfo}

Generate:
1. A clear, concise title (max 60 characters) - use existing title if good, otherwise improve it
2. A compelling description (100-150 characters) that explains what the software does - use existing description if good, otherwise write better
3. A category from: Software, Security, Productivity, Development, Design, Marketing, Analytics, Communication

Return ONLY a JSON object with keys: title, description, category
No markdown, no code blocks, just the raw JSON.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content.trim())

    return {
      title: parsed.title || metadata.title || 'Unknown Software',
      description: parsed.description || metadata.description || 'No description available',
      category: parsed.category || 'Software',
    }
  } catch (error) {
    console.error('AI generation error:', error)
    return {
      title: metadata.title || 'Unknown Software',
      description: metadata.description || 'No description available',
      category: 'Software',
    }
  }
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

    const body = await req.json()
    const { url } = body

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    try {
      new URL(url)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const metadata = await fetchUrlMetadata(url)
    const aiGenerated = await generateWithAI(url, metadata)

    const result = {
      url,
      title: aiGenerated.title,
      description: aiGenerated.description,
      category: aiGenerated.category,
      image: metadata.image || null,
      logo: metadata.favicon || null,
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
