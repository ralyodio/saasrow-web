import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import puppeteer from 'puppeteer'
import dotenv from 'dotenv'

dotenv.config()

export function expressPlugin() {
  return {
    name: 'vite-plugin-express',
    configureServer(server) {
      const app = express()

      app.use(cors())
      app.use(express.json())

      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const openai = process.env.OPENAI_API_KEY ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }) : null

      async function fetchUrlMetadata(url) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; SaaSRow/1.0)',
            },
          })

          if (!response.ok) {
            return {}
          }

          const html = await response.text()
          const metadata = {}

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
                               html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"'+\.png[^"']*)["]'/i)

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

          const socialLinks = []
          const socialPatterns = [
            { platform: 'twitter', pattern: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/gi },
            { platform: 'github', pattern: /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/gi },
            { platform: 'linkedin', pattern: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+/gi },
            { platform: 'facebook', pattern: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/gi },
            { platform: 'discord', pattern: /(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com\/invite)\/[a-zA-Z0-9]+/gi },
            { platform: 'youtube', pattern: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|@)[a-zA-Z0-9_-]+/gi },
            { platform: 'instagram', pattern: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+/gi },
          ]

          const seenUrls = new Set()
          for (const { platform, pattern } of socialPatterns) {
            const matches = html.match(pattern)
            if (matches) {
              for (let match of matches) {
                if (!match.startsWith('http')) {
                  match = `https://${match}`
                }

                const normalizedUrl = match.toLowerCase().replace(/\/$/, '')
                if (!seenUrls.has(normalizedUrl)) {
                  seenUrls.add(normalizedUrl)
                  socialLinks.push({ platform, url: match })
                }
              }
            }
          }

          if (socialLinks.length > 0) {
            metadata.socialLinks = socialLinks
          }

          return metadata
        } catch (error) {
          console.error('Error fetching metadata:', error)
          return {}
        }
      }

      function generateBasicTags(title, description, url) {
        const tags = []
        const text = `${title} ${description} ${url}`.toLowerCase()

        const tagKeywords = {
          'api': ['api', 'rest', 'graphql'],
          'cloud': ['cloud', 'aws', 'azure', 'gcp'],
          'opensource': ['open-source', 'github', 'open source'],
          'saas': ['saas', 'software as a service'],
          'security': ['security', 'encryption', 'auth'],
          'analytics': ['analytics', 'tracking', 'metrics'],
          'productivity': ['productivity', 'workflow', 'automation'],
          'ai': ['ai', 'machine learning', 'ml', 'artificial intelligence'],
          'database': ['database', 'sql', 'nosql', 'db'],
          'monitoring': ['monitoring', 'observability', 'logging'],
        }

        for (const [tag, keywords] of Object.entries(tagKeywords)) {
          if (keywords.some(keyword => text.includes(keyword))) {
            tags.push(tag)
          }
        }

        return tags.slice(0, 5)
      }

      async function generateWithAI(url, metadata) {
        if (!openai) {
          console.warn('OPENAI_API_KEY not configured, using fallback metadata')
          const basicTags = generateBasicTags(metadata.title || '', metadata.description || '', url)
          return {
            title: metadata.title || 'Unknown Software',
            description: metadata.description || 'No description available',
            category: 'Software',
            tags: basicTags,
          }
        }

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
4. 3-5 relevant tags (lowercase, single words or short phrases) that describe the software's features, use cases, or technologies (e.g., "automation", "cloud", "open-source", "saas", "api", "analytics")

Return ONLY a JSON object with keys: title, description, category, tags (array of strings)
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
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          }
        } catch (error) {
          console.error('AI generation error:', error)
          const basicTags = generateBasicTags(metadata.title || '', metadata.description || '', url)
          return {
            title: metadata.title || 'Unknown Software',
            description: metadata.description || 'No description available',
            category: 'Software',
            tags: basicTags,
          }
        }
      }

      async function captureScreenshot(url) {
        let browser = null
        try {
          browser = await puppeteer.launch({
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
            ],
          })

          const page = await browser.newPage()
          await page.setViewport({ width: 1280, height: 800 })

          await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
          })

          const screenshot = await page.screenshot({
            type: 'png',
            fullPage: false,
          })

          await browser.close()
          return screenshot
        } catch (error) {
          console.error('Failed to capture screenshot:', error)
          if (browser) {
            try {
              await browser.close()
            } catch (closeError) {
              console.error('Failed to close browser:', closeError)
            }
          }
          return null
        }
      }

      function normalizeUrl(url) {
        try {
          const urlObj = new URL(url)
          return `${urlObj.protocol}//${urlObj.host}`
        } catch {
          throw new Error('Invalid URL format')
        }
      }

      app.post('/api/fetch-metadata', async (req, res) => {
        try {
          const { url: inputUrl } = req.body

          if (!inputUrl) {
            return res.status(400).json({ error: 'URL is required' })
          }

          let url
          try {
            url = normalizeUrl(inputUrl)
          } catch {
            return res.status(400).json({
              error: 'Invalid URL format. Please provide a valid domain (e.g., https://example.com)'
            })
          }

          const { data: existing } = await supabase
            .from('software_submissions')
            .select('id, title, status')
            .eq('url', url)
            .maybeSingle()

          if (existing) {
            return res.status(409).json({
              error: `This domain has already been submitted as "${existing.title}"${existing.status === 'approved' ? ' and is live' : ' and is pending review'}.`,
              duplicate: true
            })
          }

          console.log(`[fetch-metadata] Processing URL: ${url}`)

          const metadata = await fetchUrlMetadata(url)
          console.log(`[fetch-metadata] Metadata fetched:`, {
            hasTitle: !!metadata.title,
            hasDescription: !!metadata.description,
            hasFavicon: !!metadata.favicon,
            hasImage: !!metadata.image,
            socialLinksCount: metadata.socialLinks?.length || 0
          })

          const aiGenerated = await generateWithAI(url, metadata)
          console.log(`[fetch-metadata] AI generated:`, aiGenerated)

          let logoPath = null
          let imagePath = null
          let screenshotPath = null

          try {
            console.log(`[fetch-metadata] Attempting to capture screenshot...`)
            const screenshot = await captureScreenshot(url)
            if (screenshot) {
              const fileName = `screenshot-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
              console.log(`[fetch-metadata] Screenshot captured, uploading as ${fileName}`)

              const { error: uploadError } = await supabase.storage
                .from('software-images')
                .upload(fileName, screenshot, {
                  contentType: 'image/png',
                  cacheControl: '3600',
                })

              if (!uploadError) {
                screenshotPath = fileName
                console.log(`[fetch-metadata] Screenshot uploaded successfully`)
              } else {
                console.error(`[fetch-metadata] Screenshot upload failed:`, uploadError)
              }
            } else {
              console.log(`[fetch-metadata] No screenshot captured`)
            }
          } catch (screenshotError) {
            console.error('Screenshot capture failed (non-critical):', screenshotError)
          }

          if (metadata.favicon) {
            try {
              console.log(`[fetch-metadata] Downloading logo from: ${metadata.favicon}`)
              const logoResponse = await fetch(metadata.favicon)
              if (logoResponse.ok) {
                const logoBuffer = await logoResponse.arrayBuffer()
                const contentType = logoResponse.headers.get('content-type') || 'image/png'
                const ext = contentType.split('/')[1] || 'png'
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
                console.log(`[fetch-metadata] Logo downloaded, uploading as ${fileName}`)

                const { error: uploadError } = await supabase.storage
                  .from('software-logos')
                  .upload(fileName, logoBuffer, {
                    contentType,
                    cacheControl: '3600',
                  })

                if (!uploadError) {
                  logoPath = fileName
                  console.log(`[fetch-metadata] Logo uploaded successfully`)
                } else {
                  console.error(`[fetch-metadata] Logo upload failed:`, uploadError)
                }
              } else {
                console.log(`[fetch-metadata] Logo fetch failed with status: ${logoResponse.status}`)
              }
            } catch (error) {
              console.error('Failed to download/upload logo:', error)
            }
          }

          if (metadata.image) {
            try {
              const imageResponse = await fetch(metadata.image)
              if (imageResponse.ok) {
                const imageBuffer = await imageResponse.arrayBuffer()
                const contentType = imageResponse.headers.get('content-type') || 'image/png'
                const ext = contentType.split('/')[1] || 'png'
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

                const { error: uploadError } = await supabase.storage
                  .from('software-images')
                  .upload(fileName, imageBuffer, {
                    contentType,
                    cacheControl: '3600',
                  })

                if (!uploadError) {
                  imagePath = fileName
                }
              }
            } catch (error) {
              console.error('Failed to download/upload image:', error)
            }
          }

          const result = {
            url,
            title: aiGenerated.title,
            description: aiGenerated.description,
            category: aiGenerated.category,
            tags: aiGenerated.tags,
            image: screenshotPath || imagePath,
            logo: logoPath,
            socialLinks: metadata.socialLinks || [],
          }

          console.log(`[fetch-metadata] Final result:`, {
            ...result,
            tagsCount: result.tags.length,
            hasLogo: !!result.logo,
            hasImage: !!result.image,
            socialLinksCount: result.socialLinks.length
          })

          res.json(result)
        } catch (error) {
          console.error('Server error:', error)
          res.status(500).json({
            error: error.message || 'Internal server error',
            details: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : undefined
          })
        }
      })

      server.middlewares.use(app)
    },
  }
}
