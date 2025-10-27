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
        view_count
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

      if (userTier === 'free') {
        const dailyLimit = 10
        const oneDayAgo = new Date()
        oneDayAgo.setHours(oneDayAgo.getHours() - 24)

        const { count } = await supabase
          .from('software_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('email', email)
          .gte('created_at', oneDayAgo.toISOString())

        if (count !== null && count >= dailyLimit) {
          return new Response(
            JSON.stringify({ error: `Daily submission limit reached. You have submitted ${count} times in the last 24 hours (limit: ${dailyLimit}/day). Upgrade to featured for 5 total listings or premium for unlimited.` }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      } else if (userTier === 'featured') {
        const totalLimit = 5

        const { count } = await supabase
          .from('software_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('email', email)

        if (count !== null && count >= totalLimit) {
          return new Response(
            JSON.stringify({ error: `Submission limit reached. You have ${count} of ${totalLimit} total submissions. Upgrade to premium for unlimited listings.` }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
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

      if (data?.management_token) {
        const managementUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/manage/${encodeURIComponent(data.management_token)}`
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

      if (submission.socialLinks && Array.isArray(submission.socialLinks) && data) {
        await supabase
          .from('social_links')
          .delete()
          .eq('submission_id', data.id)

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

      // Send email notification when approved
      if (status === 'approved' && data.email) {
        try {
          const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
          const listingUrl = `${siteUrl}/software/${data.id}`
          const managementUrl = `${siteUrl}/manage/${data.management_token}`

          const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
          const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN')

          if (mailgunApiKey && mailgunDomain) {
            const formData = new FormData()
            formData.append('from', `SaaSRow <noreply@${mailgunDomain}>`)
            formData.append('to', data.email)
            formData.append('subject', `🎉 Your listing "${data.title}" has been approved!`)
            formData.append('html', `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #E0FF04 0%, #4FFFE3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .header h1 { margin: 0; color: #1a1a1a; font-size: 28px; }
                  .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                  .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #E0FF04 0%, #4FFFE3 100%); color: #1a1a1a; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 10px 5px; }
                  .listing-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Listing Approved!</h1>
                  </div>
                  <div class="content">
                    <p>Great news! Your software listing has been approved and is now live on SaaSRow.</p>

                    <div class="listing-info">
                      <strong>${data.title}</strong><br>
                      <span style="color: #666;">${data.description}</span>
                    </div>

                    <p>Your listing is now visible to our community and can be discovered by potential users.</p>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${listingUrl}" class="button">View Your Listing</a>
                      <a href="${managementUrl}" class="button">Manage Listing</a>
                    </div>

                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
                      <strong>Pro tip:</strong> Want to boost your listing's visibility? Upgrade to Featured or Premium tier for homepage placement, advanced analytics, and priority support.
                    </p>
                    <p style="padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9; margin: 20px 0; border-radius: 4px;">
                      💡 <strong>Get 20% off your upgrade!</strong> Join our newsletter to receive an exclusive discount coupon for Featured or Premium tier upgrades, plus tips on maximizing your listing's reach.
                    </p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} SaaSRow. All rights reserved.</p>
                    <p>Questions? Reply to this email or visit our support page.</p>
                  </div>
                </div>
              </body>
              </html>
            `)

            const mailgunUrl = `https://api.mailgun.net/v3/${mailgunDomain}/messages`
            const mailgunResponse = await fetch(mailgunUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`,
              },
              body: formData,
            })

            if (!mailgunResponse.ok) {
              const errorText = await mailgunResponse.text()
              console.error('Failed to send approval email:', errorText)
            } else {
              console.log(`Approval email sent to ${data.email} for listing: ${data.title}`)
            }
          } else {
            console.warn('Mailgun credentials not configured. Skipping approval email.')
          }
        } catch (emailError) {
          console.error('Error sending approval email:', emailError)
          // Don't fail the request if email fails
        }
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
