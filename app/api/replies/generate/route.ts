import { NextRequest } from 'next/server'
import { apiResponse, apiError } from '@/lib/utils'
import { getTextProvider } from '@/lib/ai-providers'

export async function POST(request: NextRequest) {
  try {
    const { tweetText, tweetAuthor } = await request.json()
    
    if (!tweetText || !tweetAuthor) {
      return apiError('Tweet text and author are required')
    }
    
    const provider = getTextProvider()
    const suggestions = await provider.generateReply(tweetText, tweetAuthor)
    
    return apiResponse({ suggestions })
  } catch (error) {
    console.error('Failed to generate reply suggestions:', error)
    return apiError('Failed to generate reply suggestions', 500)
  }
}