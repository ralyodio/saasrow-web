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

      // If token is provided, fetch submissions for that token
      if (token) {
        // First, check if this is a user token (for paid users)
        const { data: userToken } = await supabase
          .from('user_tokens')
          .select('email')
          .eq('token', token)
          .maybeSingle()

        if (userToken) {
          // Paid user - fetch all their submissions by email
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

        // Not a user token, check if it's a management token (for free users)
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

        // Must have at least one submission with this token
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

      let query = client
        .from('software_submissions')
        .select('*')
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

      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { data: existing } = await supabase
        .from('software_submissions')
        .select('id')
        .eq('url', url)
        .maybeSingle()

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'This URL has already been submitted' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const { data: userToken } = await supabase
        .from('user_tokens')
        .select('tier')
        .eq('email', email)
        .maybeSingle()

      const userTier = userToken?.tier || 'free'

      const tierLimits = {
        free: 1,
        basic: 10,
        premium: 999999
      }

      const { count } = await supabase
        .from('software_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const limit = tierLimits[userTier as keyof typeof tierLimits] || 1

      if (count && count >= limit) {
        return new Response(
          JSON.stringify({ error: `Submission limit reached. ${userTier === 'free' ? 'Upgrade to submit more' : 'Please try again in 24 hours'}` }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const submissionData: any = {
        title,
        url,
        description,
        email,
        category,
        status: 'pending',
        tier: userTier
      }

      if (tags && Array.isArray(tags)) {
        submissionData.tags = tags
      }

      if (logo) {
        submissionData.logo = logo
      }

      if (image) {
        submissionData.image = image
      }

      const { data, error } = await supabase
        .from('software_submissions')
        .insert(submissionData)
        .select()
        .maybeSingle()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (data && socialLinks && Array.isArray(socialLinks) && socialLinks.length > 0) {
        const socialLinkInserts = socialLinks.map((link: { platform: string; url: string }) => ({
          submission_id: data.id,
          platform: link.platform,
          url: link.url,
        }))

        const { error: socialError } = await supabase
          .from('social_links')
          .insert(socialLinkInserts)

        if (socialError) {
          console.error('Failed to insert social links:', socialError)
        }
      }

      // Send management link email
      if (data?.management_token) {
        const managementUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/manage/${encodeURIComponent(data.management_token)}`

        // TODO: Implement email sending
        console.log('Management URL:', managementUrl)
      }

      return new Response(
        JSON.stringify({
          data,
          message: 'Submission created successfully',
          managementToken: data?.management_token
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'PUT') {
      const body = await req.json()
      const { token, submission } = body

      if (!token || !submission) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: token, submission' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Verify token exists
      const { data: existing } = await supabase
        .from('software_submissions')
        .select('id, email')
        .eq('management_token', token)
        .maybeSingle()

      if (!existing) {
        return new Response(
          JSON.stringify({ error: 'Invalid management token' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const updateData: any = {}
      if (submission.title) updateData.title = submission.title
      if (submission.url) updateData.url = submission.url
      if (submission.description) updateData.description = submission.description
      if (submission.category) updateData.category = submission.category
      if (submission.tags) updateData.tags = submission.tags
      if (submission.logo !== undefined) updateData.logo = submission.logo
      if (submission.image !== undefined) updateData.image = submission.image

      const { data, error } = await supabase
        .from('software_submissions')
        .update(updateData)
        .eq('management_token', token)
        .select()
        .maybeSingle()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Update social links if provided
      if (submission.socialLinks && Array.isArray(submission.socialLinks) && data) {
        // Delete existing social links
        await supabase
          .from('social_links')
          .delete()
          .eq('submission_id', data.id)

        // Insert new social links
        if (submission.socialLinks.length > 0) {
          const socialLinkInserts = submission.socialLinks.map((link: { platform: string; url: string }) => ({
            submission_id: data.id,
            platform: link.platform,
            url: link.url,
          }))

          await supabase
            .from('social_links')
            .insert(socialLinkInserts)
        }
      }

      return new Response(
        JSON.stringify({ data, message: 'Submission updated successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'PATCH') {
      const body = await req.json()
      const { id, status } = body

      if (!id || !status) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: id, status' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be: pending, approved, or rejected' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { data, error } = await supabaseAdmin
        .from('software_submissions')
        .update({ status })
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Submission not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ data, message: 'Status updated successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (req.method === 'DELETE') {
      const body = await req.json()
      const { id } = body

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: id' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { data: submission, error: fetchError } = await supabaseAdmin
        .from('software_submissions')
        .select('logo, image')
        .eq('id', id)
        .maybeSingle()

      if (fetchError || !submission) {
        return new Response(
          JSON.stringify({ error: 'Submission not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      if (submission.logo) {
        await supabaseAdmin.storage
          .from('software-logos')
          .remove([submission.logo])
      }

      if (submission.image) {
        await supabaseAdmin.storage
          .from('software-images')
          .remove([submission.image])
      }

      await supabaseAdmin
        .from('social_links')
        .delete()
        .eq('submission_id', id)

      const { error: deleteError } = await supabaseAdmin
        .from('software_submissions')
        .delete()
        .eq('id', id)

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})