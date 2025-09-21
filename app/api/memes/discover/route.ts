import { NextRequest } from 'next/server'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    const targetUrl = url || 'https://runwithgugo.com/memes'

    // Fetch the page
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return apiError(`Failed to fetch ${targetUrl}: ${response.statusText}`, 400)
    }

    const html = await response.text()
    const imageUrls = new Set<string>()

    // Look for Supabase storage URLs (common pattern for GUGO memes)
    const supabaseRegex = /https:\/\/\w+\.supabase\.co\/storage\/v1\/object\/public\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi
    let match
    while ((match = supabaseRegex.exec(html)) !== null) {
      imageUrls.add(match[0])
    }

    // Look for other image URLs
    const imageRegex = /<img[^>]+src=["']([^"']*\.(jpg|jpeg|png|gif|webp))["'][^>]*>/gi
    while ((match = imageRegex.exec(html)) !== null) {
      let src = match[1]
      // Convert relative URLs to absolute
      if (src.startsWith('/')) {
        const baseUrl = new URL(targetUrl).origin
        src = baseUrl + src
      } else if (!src.startsWith('http')) {
        const baseUrl = new URL(targetUrl).origin
        src = baseUrl + '/' + src
      }
      imageUrls.add(src)
    }

    // Look for direct image links
    const linkRegex = /<a[^>]+href=["']([^"']*\.(jpg|jpeg|png|gif|webp))["'][^>]*>/gi
    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1]
      if (href.startsWith('/')) {
        const baseUrl = new URL(targetUrl).origin
        href = baseUrl + href
      } else if (!href.startsWith('http')) {
        const baseUrl = new URL(targetUrl).origin
        href = baseUrl + '/' + href
      }
      imageUrls.add(href)
    }

    const discoveredUrls = Array.from(imageUrls)

    return apiResponse({
      message: `Discovered ${discoveredUrls.length} image URLs`,
      urls: discoveredUrls,
      source: targetUrl
    })

  } catch (error) {
    console.error('Failed to discover memes:', error)
    return apiError('Failed to discover memes', 500)
  }
}