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
    const apiUrl = new URL("https://api.rasterwise.com/v1/get-screenshot");
    apiUrl.searchParams.set("apikey", GETSCREENSHOT_API_KEY!);
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("format", "png");
    apiUrl.searchParams.set("fullpage", "false");
    apiUrl.searchParams.set("width", "1280");
    apiUrl.searchParams.set("height", "800");
    apiUrl.searchParams.set("hidecookie", "true");
    apiUrl.searchParams.set("hidemsg", "true");

    console.log(`Requesting screenshot from Rasterwise GetScreenshot API for: ${url}`);
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Auth': 'allow',
        'cache-control': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Screenshot API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Rasterwise API error (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    console.log(`Screenshot API response content-type: ${contentType}`);

    if (contentType && contentType.includes("application/json")) {
      const jsonResponse = await response.json();
      console.log(`Rasterwise API returned JSON response:`, jsonResponse);

      if (jsonResponse.status === "success" && jsonResponse.screenshotImage) {
        console.log(`Downloading screenshot from: ${jsonResponse.screenshotImage}`);
        const imageResponse = await fetch(jsonResponse.screenshotImage);

        if (!imageResponse.ok) {
          throw new Error(`Failed to download screenshot image: ${imageResponse.status}`);
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        console.log(`Screenshot downloaded successfully: ${buffer.length} bytes`);

        if (buffer.length === 0) {
          throw new Error(`Screenshot image is empty`);
        }

        return buffer;
      } else {
        throw new Error(`Rasterwise API error: ${JSON.stringify(jsonResponse)}`);
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    console.log(`Screenshot captured successfully: ${buffer.length} bytes`);

    if (buffer.length === 0) {
      console.error(`Screenshot buffer is empty for ${url}`);
      throw new Error(`Rasterwise returned empty image buffer for ${url}`);
    }

    return buffer;
  } catch (error) {
    console.error(`Error capturing screenshot for ${url}:`, error);
    throw error;
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

    console.log(`Starting screenshot capture process for ${url}`);
    console.log(`Extracting navigation links from ${url}`);
    const navLinks = await extractTopNavLinks(url);

    console.log(`Initial extraction found ${navLinks.length} links`);

    if (navLinks.length === 0) {
      console.log("No navigation links found, capturing homepage only");
      navLinks.push({ text: "Home", href: url });
    }

    console.log(`Total links to screenshot: ${navLinks.length}`);
    console.log(`Links:`, JSON.stringify(navLinks, null, 2));

    const screenshotResults = [];
    const errors = [];

    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      console.log(`[${i + 1}/${navLinks.length}] Capturing screenshot for: ${link.text} (${link.href})`);

      try {
        const screenshotBuffer = await captureScreenshot(link.href);

        if (!screenshotBuffer) {
          const errorMsg = `Failed to capture screenshot for ${link.href}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

      console.log(`Screenshot captured, size: ${screenshotBuffer.length} bytes`);

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
      } catch (error) {
        const errorMsg = `Failed to capture screenshot for ${link.href}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`Screenshot capture complete. Success: ${screenshotResults.length}, Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.error(`Errors encountered:`, errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        screenshotCount: screenshotResults.length,
        screenshots: screenshotResults,
        errors: errors.length > 0 ? errors : undefined,
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
