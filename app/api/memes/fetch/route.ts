import { NextRequest } from 'next/server'
import { apiResponse, apiError } from '@/lib/utils'

// Default GUGO meme collection - ONLY GUGO branded content
const DEFAULT_MEMES = [
  // These should be replaced with actual GUGO memes from your collection
  // For now, using the one available GUGO meme as placeholder
  {
    id: 'gugo_main',
    url: 'https://wxnjauindygyohnemrjg.supabase.co/storage/v1/object/public/memes/uploads/1752002060073-ir265om89c.jpeg',
    alt: 'GUGO We Just Run',
    source: 'runwithgugo.com'
  }
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    
    // Try to fetch from runwithgugo.com
    let memes = [...DEFAULT_MEMES]
    
    try {
      const response = await fetch('https://runwithgugo.com/memes', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      
      if (response.ok) {
        const html = await response.text()
        
        // Look for Supabase storage URLs which seem to be the GUGO meme pattern
        const supabaseRegex = /https:\/\/\w+\.supabase\.co\/storage\/v1\/object\/public\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi
        let match
        
        while ((match = supabaseRegex.exec(html)) !== null) {
          const url = match[0]
          if (!memes.some(m => m.url === url)) {
            memes.unshift({
              id: Buffer.from(url).toString('base64').slice(0, 10),
              url: url,
              alt: 'GUGO Meme',
              source: 'runwithgugo.com'
            })
          }
        }
        
        // Look for other GUGO-related images
        const gugoImageRegex = /<img[^>]+src=["']([^"']*(?:gugo|GUGO)[^"']*\.(jpg|jpeg|png|gif|webp))["'][^>]*>/gi
        while ((match = gugoImageRegex.exec(html)) !== null) {
          const src = match[1]
          const fullUrl = src.startsWith('http') ? src : `https://runwithgugo.com${src.startsWith('/') ? '' : '/'}${src}`
          
          if (!memes.some(m => m.url === fullUrl)) {
            memes.push({
              id: Buffer.from(fullUrl).toString('base64').slice(0, 10),
              url: fullUrl,
              alt: 'GUGO Meme',
              source: 'runwithgugo.com'
            })
          }
        }
      }
    } catch (fetchError) {
      console.log('Could not fetch from runwithgugo.com, using defaults:', fetchError)
    }
    
    const filteredMemes = query 
      ? memes.filter(meme => 
          meme.alt.toLowerCase().includes(query.toLowerCase())
        )
      : memes
    
    return apiResponse({ 
      memes: filteredMemes.slice(0, 12),
      total: filteredMemes.length 
    })
  } catch (error) {
    console.error('Failed to fetch memes:', error)
    return apiError('Failed to fetch memes', 500)
  }
}