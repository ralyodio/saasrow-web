import { createClient } from 'npm:@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, PUT, OPTIONS',
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const includeAll = url.searchParams.get('all') === 'true'
      const token = url.searchParams.get('token')

      if (token) {
        const { data: userToken } = await supabase
          .from('user_tokens')
          .select('email')
          .eq('token', token)
          .maybeSingle()

        if (userToken) {
          const { data, error } = await supabase
            .from('software_submissions')
            .select(`
              *,
              social_links (
                id,
                platform,
                url
              )
            `)
            .eq('email', userToken.email)
            .order('created_at', { ascending: false })

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            )
          }

          return new Response(
            JSON.stringify({ data, email: userToken.email }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { data, error } = await supabase
          .from('software_submissions')
          .select(`
            *,
            social_links (
              id,
              platform,
              url
            )
          `)
          .eq('management_token', token)
          .order('created_at', { ascending: false })

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        if (!data || data.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Invalid management token' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const email = data[0].email

        return new Response(
          JSON.stringify({ data, email }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const client = includeAll
        ? createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          )
        : supabase

      const publicFields = `
        id,
        title,
        url,
        description,
        category,
        tags,
        logo,
        image,
        status,
        tier,
        featured,
        is_featured,
        featured_until,
        analytics_enabled,
        homepage_featured,
        custom_profile_url,
        newsletter_featured,
        monthly_analytics_enabled,
        social_media_mentions,
        category_logo_enabled,
        submitted_at,
        created_at,
        view_count,
        upvotes,
        downvotes,
        share_count,
        last_share_reset
      `

      let query = client
        .from('software_submissions')
        .select(includeAll ? '*' : publicFields)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!includeAll) {
        query = query.eq('status', 'approved')
      }

      const { data, error } = await query

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (!includeAll && data) {
        const submissionIds = data.map((s: any) => s.id)
        const { data: commentCounts } = await supabase
          .from('comments')
          .select('submission_id')
          .eq('is_verified', true)
          .in('submission_id', submissionIds)

        const countMap = commentCounts?.reduce((acc: any, comment: any) => {
          acc[comment.submission_id] = (acc[comment.submission_id] || 0) + 1
          return acc
        }, {}) || {}

        const dataWithCounts = data.map((submission: any) => ({
          ...submission,
          comment_count: countMap[submission.id] || 0
        }))

        return new Response(
          JSON.stringify({ data: dataWithCounts }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { title, url, description, email, category, tags, logo, image, socialLinks } = body

      if (!title || !url || !description || !email || !category) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: title, url, description, email, category' }),
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

      const managementToken = crypto.randomUUID()

      const { data: submission, error } = await supabase
        .from('software_submissions')
        .insert({
          title,
          url,
          description,
          email,
          category,
          tags: tags || [],
          logo,
          image,
          status: 'pending',
          management_token: managementToken,
          tier: 'basic',
        })
        .select()
        .single()

      if (error) {
        console.error('Submission error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (socialLinks && Array.isArray(socialLinks) && socialLinks.length > 0) {
        const socialLinksData = socialLinks.map((link: any) => ({
          submission_id: submission.id,
          platform: link.platform,
          url: link.url,
        }))

        const { error: socialError } = await supabase
          .from('social_links')
          .insert(socialLinksData)

        if (socialError) {
          console.error('Social links error:', socialError)
        }
      }

      return new Response(
        JSON.stringify({ 
          data: submission,
          message: 'Submission created successfully'
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'PATCH') {
      const body = await req.json()
      const { id, token, ...updates } = body

      if (!id || !token) {
        return new Response(
          JSON.stringify({ error: 'Missing id or token' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { data: existing } = await supabase
        .from('software_submissions')
        .select('management_token')
        .eq('id', id)
        .single()

      if (!existing || existing.management_token !== token) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { data, error } = await supabase
        .from('software_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'DELETE') {
      const body = await req.json()
      const { id, token } = body

      if (!id || !token) {
        return new Response(
          JSON.stringify({ error: 'Missing id or token' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { data: existing } = await supabase
        .from('software_submissions')
        .select('management_token')
        .eq('id', id)
        .single()

      if (!existing || existing.management_token !== token) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { error } = await supabase
        .from('software_submissions')
        .delete()
        .eq('id', id)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Submission deleted successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
