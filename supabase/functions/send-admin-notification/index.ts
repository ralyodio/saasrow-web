import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationRequest {
  type: "new_submission" | "new_subscription";
  data: {
    email?: string;
    title?: string;
    url?: string;
    tier?: string;
    category?: string;
  };
}

async function sendEmailViaMailgun(subject: string, htmlContent: string, textContent: string) {
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN");
  const adminEmail = Deno.env.get("ADMIN_EMAIL");

  if (!mailgunApiKey || !mailgunDomain || !adminEmail) {
    console.log("Email configuration missing. Would send:", subject);
    return false;
  }

  const formData = new FormData();
  formData.append("from", "SaaSRow Notifications <noreply@saasrow.com>");
  formData.append("to", adminEmail);
  formData.append("subject", subject);
  formData.append("html", htmlContent);
  formData.append("text", textContent);

  const response = await fetch(
    `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    console.error("Mailgun error:", await response.text());
    return false;
  }

  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { type, data }: NotificationRequest = await req.json();

    if (!type || !data) {
      return new Response(
        JSON.stringify({ error: "Missing type or data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let subject: string;
    let htmlContent: string;
    let textContent: string;

    if (type === "new_submission") {
      subject = `🚀 New Submission: ${data.title || "Untitled"}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { border-bottom: 3px solid #4FFFE3; padding-bottom: 16px; margin-bottom: 24px; }
              h1 { color: #1a1a1a; font-size: 24px; margin: 0; }
              .info { background: #f8f9fa; border-left: 4px solid #4FFFE3; padding: 16px; margin: 16px 0; border-radius: 4px; }
              .label { font-weight: 600; color: #666; display: inline-block; width: 100px; }
              .value { color: #1a1a1a; }
              a { color: #4FFFE3; text-decoration: none; }
              .button { display: inline-block; background: linear-gradient(135deg, #E0FF04 0%, #4FFFE3 100%); color: #0a0a0a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 New Software Submission</h1>
              </div>
              <div class="info">
                <p><span class="label">Title:</span> <span class="value"><strong>${data.title}</strong></span></p>
                <p><span class="label">URL:</span> <span class="value"><a href="${data.url}" target="_blank">${data.url}</a></span></p>
                <p><span class="label">Category:</span> <span class="value">${data.category}</span></p>
                <p><span class="label">Email:</span> <span class="value">${data.email}</span></p>
              </div>
              <p style="color: #666; margin-top: 24px;">A new software has been submitted and is pending review.</p>
              <a href="${Deno.env.get("SITE_URL") || "https://saasrow.com"}/admin" class="button">Review in Admin Dashboard</a>
            </div>
          </body>
        </html>
      `;
      textContent = `
🚀 New Software Submission

Title: ${data.title}
URL: ${data.url}
Category: ${data.category}
Email: ${data.email}

A new software has been submitted and is pending review.

Review in Admin Dashboard: ${Deno.env.get("SITE_URL") || "https://saasrow.com"}/admin
      `;
    } else if (type === "new_subscription") {
      subject = `💰 New ${data.tier} Subscription!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { border-bottom: 3px solid #E0FF04; padding-bottom: 16px; margin-bottom: 24px; }
              h1 { color: #1a1a1a; font-size: 24px; margin: 0; }
              .info { background: #f8f9fa; border-left: 4px solid #E0FF04; padding: 16px; margin: 16px 0; border-radius: 4px; }
              .label { font-weight: 600; color: #666; display: inline-block; width: 100px; }
              .value { color: #1a1a1a; }
              .tier-badge { display: inline-block; background: linear-gradient(135deg, #E0FF04 0%, #4FFFE3 100%); color: #0a0a0a; padding: 4px 12px; border-radius: 12px; font-weight: 700; text-transform: uppercase; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 New Subscription</h1>
              </div>
              <div class="info">
                <p><span class="label">Email:</span> <span class="value">${data.email}</span></p>
                <p><span class="label">Tier:</span> <span class="tier-badge">${data.tier}</span></p>
              </div>
              <p style="color: #666; margin-top: 24px;">A new user has subscribed to the ${data.tier} tier. 🎉</p>
            </div>
          </body>
        </html>
      `;
      textContent = `
💰 New Subscription

Email: ${data.email}
Tier: ${data.tier?.toUpperCase()}

A new user has subscribed to the ${data.tier} tier. 🎉
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const sent = await sendEmailViaMailgun(subject, htmlContent, textContent);

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        message: sent ? "Notification sent" : "Notification logged (email not configured)",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
