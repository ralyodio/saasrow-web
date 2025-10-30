import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.76.1";
import * as cheerio from "npm:cheerio@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GETSCREENSHOT_API_KEY = Deno.env.get("GETSCREENSHOT_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface ScreenshotRequest {
  submissionId: string;
  url: string;
  tier: string;
}

interface NavLink {
  text: string;
  href: string;
}

async function extractTopNavLinks(url: string): Promise<NavLink[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const links: NavLink[] = [];
    const seenUrls = new Set<string>();

    const selectors = [
      'header nav a',
      'nav a',
      '.nav a',
      '.navigation a',
      '.menu a',
      '.navbar a',
      '[role="navigation"] a'
    ];

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();

        if (href && text && !seenUrls.has(href)) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            const urlObj = new URL(url);
            fullUrl = `${urlObj.origin}${href}`;
          } else if (!href.startsWith('http')) {
            const urlObj = new URL(url);
            fullUrl = `${urlObj.origin}/${href}`;
          }

          if (fullUrl.startsWith('http') && !fullUrl.includes('#')) {
            links.push({ text, href: fullUrl });
            seenUrls.add(href);
          }
        }
      });

      if (links.length >= 5) break;
    }

    return links.slice(0, 5);
  } catch (error) {
    console.error(`Error extracting nav links from ${url}:`, error);
    return [];
  }
}

async function captureScreenshot(url: string): Promise<Uint8Array | null> {
  try {
    const apiUrl = new URL("https://api.screenshotone.com/take");
    apiUrl.searchParams.set("access_key", GETSCREENSHOT_API_KEY!);
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("format", "png");
    apiUrl.searchParams.set("full_page", "false");
    apiUrl.searchParams.set("viewport_width", "1280");
    apiUrl.searchParams.set("viewport_height", "800");
    apiUrl.searchParams.set("block_cookie_banners", "true");
    apiUrl.searchParams.set("block_chats", "true");

    console.log(`Requesting screenshot from ScreenshotOne API for: ${url}`);
    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Screenshot API error: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const contentType = response.headers.get("content-type");
    console.log(`Screenshot API response content-type: ${contentType}`);

    if (!contentType || !contentType.includes("image")) {
      const responseText = await response.text();
      console.error(`Unexpected response type: ${contentType}. Response: ${responseText.substring(0, 500)}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    console.log(`Screenshot captured successfully: ${buffer.length} bytes`);

    if (buffer.length === 0) {
      console.error(`Screenshot buffer is empty for ${url}`);
      return null;
    }

    return buffer;
  } catch (error) {
    console.error(`Error capturing screenshot for ${url}:`, error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!GETSCREENSHOT_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GETSCREENSHOT_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { submissionId, url, tier }: ScreenshotRequest = await req.json();

    if (!submissionId || !url || !tier) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: submissionId, url, tier" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (tier !== "featured" && tier !== "premium") {
      return new Response(
        JSON.stringify({ error: "Screenshot gallery is only available for Basic and Premium tiers" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Checking for existing screenshots for submission ${submissionId}`);
    const { data: existingScreenshots } = await supabase
      .from("submission_screenshots")
      .select("id, storage_path")
      .eq("submission_id", submissionId);

    if (existingScreenshots && existingScreenshots.length > 0) {
      console.log(`Found ${existingScreenshots.length} existing screenshots, deleting them...`);

      for (const screenshot of existingScreenshots) {
        if (screenshot.storage_path) {
          await supabase.storage
            .from("submission-screenshots")
            .remove([screenshot.storage_path]);
          console.log(`Deleted storage file: ${screenshot.storage_path}`);
        }
      }

      await supabase
        .from("submission_screenshots")
        .delete()
        .eq("submission_id", submissionId);
      console.log(`Deleted database records for submission ${submissionId}`);
    }

    console.log(`Extracting navigation links from ${url}`);
    const navLinks = await extractTopNavLinks(url);

    if (navLinks.length === 0) {
      console.log("No navigation links found, capturing homepage only");
      navLinks.push({ text: "Home", href: url });
    }

    console.log(`Found ${navLinks.length} navigation links to screenshot`);

    const screenshotResults = [];

    for (const link of navLinks) {
      console.log(`Capturing screenshot for: ${link.text} (${link.href})`);
      
      const screenshotBuffer = await captureScreenshot(link.href);
      
      if (!screenshotBuffer) {
        console.error(`Failed to capture screenshot for ${link.href}`);
        continue;
      }

      const timestamp = Date.now();
      const sanitizedTitle = link.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const fileName = `${submissionId}/${timestamp}-${sanitizedTitle}.png`;

      console.log(`Uploading screenshot to storage: ${fileName}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("submission-screenshots")
        .upload(fileName, screenshotBuffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error(`Error uploading screenshot to storage:`, uploadError);
        continue;
      }

      console.log(`Upload successful, generating public URL for: ${fileName}`);
      const { data: publicUrlData } = supabase.storage
        .from("submission-screenshots")
        .getPublicUrl(fileName);

      console.log(`Public URL generated: ${publicUrlData.publicUrl}`);

      const { error: dbError } = await supabase
        .from("submission_screenshots")
        .insert({
          submission_id: submissionId,
          screenshot_url: publicUrlData.publicUrl,
          page_url: link.href,
          page_title: link.text,
          storage_path: fileName,
        });

      if (dbError) {
        console.error(`Error saving screenshot metadata to database:`, dbError);
        continue;
      }

      screenshotResults.push({
        pageTitle: link.text,
        pageUrl: link.href,
        screenshotUrl: publicUrlData.publicUrl,
      });

      console.log(`Successfully captured and stored screenshot for ${link.text}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        screenshotCount: screenshotResults.length,
        screenshots: screenshotResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in capture-screenshots function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
