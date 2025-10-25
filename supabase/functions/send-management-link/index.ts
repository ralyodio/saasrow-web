import { createClient } from 'npm:@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
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

    const { data: submissions, error } = await supabase
      .from('software_submissions')
      .select('management_token')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !submissions) {
      return new Response(
        JSON.stringify({ error: 'No submissions found for this email address' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const managementUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/manage/${submissions.management_token}`

    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Ubuntu', Arial, sans-serif; background-color: #1a1a1a; color: #ffffff; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #2a2a2a; border-radius: 16px; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; font-weight: bold; color: #4FFFE3; margin-bottom: 10px; }
            .content { color: #cccccc; line-height: 1.6; margin-bottom: 30px; }
            .button { display: inline-block; background: linear-gradient(to bottom, #E0FF04, #4FFFE3); color: #1a1a1a; padding: 16px 32px; border-radius: 24px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SaaSRow</div>
              <h2 style="color: #4FFFE3; margin: 0;">Manage Your Listings</h2>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p>Thank you for submitting your software to SaaSRow. Your submission is being reviewed and will be live soon.</p>
              <p>Use the link below to manage your listings, track performance, and make updates anytime:</p>
              <div style="text-align: center;">
                <a href="${managementUrl}" class="button">Manage My Listings</a>
              </div>
              <p style="font-size: 14px; color: #888888;">If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${managementUrl}" style="color: #4FFFE3; word-break: break-all;">${managementUrl}</a></p>
            </div>
            <div class="footer">
              <p>This is an automated email from SaaSRow. Please keep this email safe as it contains your unique management link.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailText = `
Hi there!

Thank you for submitting your software to SaaSRow. Your submission is being reviewed and will be live soon.

Use the link below to manage your listings, track performance, and make updates anytime:

${managementUrl}

This is an automated email from SaaSRow. Please keep this email safe as it contains your unique management link.
    `

    const { error: emailError } = await supabaseServiceRole.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      if (resendApiKey) {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SaaSRow <noreply@saasrow.com>',
            to: [email],
            subject: 'Manage Your SaaSRow Listings',
            html: emailHtml,
            text: emailText,
          }),
        })

        if (!resendResponse.ok) {
          console.error('Resend API error:', await resendResponse.text())
        }
      } else {
        console.log('RESEND_API_KEY not configured, would send email to:', email)
        console.log('Management URL:', managementUrl)
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr)
    }

    return new Response(
      JSON.stringify({
        message: 'Management link sent to your email. Please check your inbox.',
        success: true
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