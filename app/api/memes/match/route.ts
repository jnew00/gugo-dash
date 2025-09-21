import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTextProvider } from '@/lib/ai-providers'
import { apiResponse, apiError } from '@/lib/utils'

function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case 'deepseek': return 'DeepSeek R1'
    case 'openai': return 'OpenAI GPT'
    case 'local': return 'Local LLM'
    case 'keyword': return 'Keyword Matching'
    case 'random': return 'Random Selection'
    default: return 'Unknown Provider'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tweetText, tweetAuthor } = await request.json()

    if (!tweetText) {
      return apiError('Tweet text is required', 400)
    }

    // Get all available memes
    const memes = await prisma.meme.findMany({
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    if (memes.length === 0) {
      return apiResponse({ matches: [], message: 'No memes available' })
    }

    // Get admin settings for the meme matching model
    const settings = await prisma.adminSettings.findUnique({
      where: { id: 'admin' }
    })

    const modelProvider = settings?.memeMatchModel || 'deepseek'

    try {
      const provider = getTextProvider(modelProvider as any)

      // Create a prompt for meme matching, prioritizing descriptions
      const memeDescriptions = memes.map(meme => {
        const desc = meme.description || 'No description'
        const tags = meme.tags.length > 0 ? ` (Tags: ${meme.tags.join(', ')})` : ''
        return `ID: ${meme.id} - ${desc}${tags}`
      }).join('\n')

      const matchingPrompt = `
Tweet: "${tweetText}"
Author: ${tweetAuthor}

Available memes (focus on descriptions for relevance):
${memeDescriptions}

Analyze the tweet content and recommend the top 3 most relevant memes from the list above. Focus heavily on:
1. Description relevance to tweet content/emotion
2. Situational match (what's happening in the meme vs tweet context)
3. Emotional tone alignment
4. Humor potential and timing

Prioritize memes with detailed descriptions that match the tweet's situation or emotion.

Respond with only the meme IDs in order of relevance, separated by commas. If no memes are relevant, respond with "none".
Example: id1,id2,id3
`

      // Check if API is configured
      const apiBase = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1'
      const apiKey = process.env.DEEPSEEK_API_KEY

      if (!apiKey || apiKey === 'your-deepseek-api-key-here') {
        throw new Error('API key not configured')
      }

      // For this specific case, we'll use a simple text generation approach
      const response = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: matchingPrompt
            }
          ],
          max_tokens: 100,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get meme recommendations')
      }

      const data = await response.json()
      const recommendations = data.choices[0]?.message?.content?.trim() || 'none'

      if (recommendations === 'none') {
        return apiResponse({ matches: [], message: 'No relevant memes found' })
      }

      // Parse the recommendations and get full meme data
      const recommendedIds = recommendations.split(',').map((id: string) => id.trim())
      const matchedMemes = memes.filter(meme => recommendedIds.includes(meme.id))

      // Sort by the order of recommendations
      const sortedMatches = recommendedIds
        .map((id: string) => matchedMemes.find(meme => meme.id === id))
        .filter(Boolean)

      return apiResponse({
        matches: sortedMatches,
        message: `Found ${sortedMatches.length} relevant memes`,
        provider: modelProvider,
        providerName: getProviderDisplayName(modelProvider)
      })

    } catch (providerError) {
      console.error('Meme matching provider error:', providerError)

      // Fallback: Enhanced keyword and context matching
      const tweetLower = tweetText.toLowerCase()
      const keywords = tweetLower.split(/\s+/).filter(word => word.length > 3)

      // Score each meme based on relevance, heavily weighting descriptions
      const scoredMemes = memes.map(meme => {
        const description = (meme.description || '').toLowerCase()
        const tagsText = meme.tags.join(' ').toLowerCase()
        const filename = meme.filename.toLowerCase()
        let score = 0

        // Heavy weight for description matches (5x more than tags)
        keywords.forEach(keyword => {
          if (description.includes(keyword)) score += 10  // High score for description matches
          if (tagsText.includes(keyword)) score += 2      // Lower score for tag matches
          if (filename.includes(keyword)) score += 1      // Lowest for filename
        })

        // Check for common meme-triggering words in description
        const memeWords = ['win', 'lose', 'fail', 'success', 'money', 'rich', 'poor', 'run', 'gugo', 'moon', 'dump', 'pump', 'chad', 'based', 'confused', 'excited', 'happy', 'sad', 'angry', 'thinking', 'celebrating']
        memeWords.forEach(word => {
          if (tweetLower.includes(word)) {
            if (description.includes(word)) score += 8     // Heavy weight for description
            if (tagsText.includes(word)) score += 2       // Light weight for tags
          }
        })

        // Boost for GUGO-specific content
        if (description.includes('gugo') || meme.tags.includes('gugo') || meme.tags.includes('official')) score += 2

        // Enhanced sentiment alignment using descriptions
        const positiveWords = ['great', 'awesome', 'amazing', 'good', 'nice', 'love', 'win', 'success', 'happy', 'excited', 'celebrating', 'thumbs up']
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'fail', 'lose', 'dump', 'sad', 'crying', 'confused', 'frustrated']

        const hasPositive = positiveWords.some(word => tweetLower.includes(word))
        const hasNegative = negativeWords.some(word => tweetLower.includes(word))

        if (hasPositive) {
          positiveWords.forEach(word => {
            if (description.includes(word)) score += 5
            if (tagsText.includes(word)) score += 1
          })
        }

        if (hasNegative) {
          negativeWords.forEach(word => {
            if (description.includes(word)) score += 5
            if (tagsText.includes(word)) score += 1
          })
        }

        // Bonus for memes with good descriptions
        if (meme.description && meme.description.length > 20) score += 1

        return { ...meme, score }
      })

      // Sort by score and return top 3
      const topMemes = scoredMemes
        .sort((a, b) => b.score - a.score)
        .filter(meme => meme.score > 0)
        .slice(0, 3)
        .map(({ score, ...meme }) => meme)

      // If no matches found, return random memes
      if (topMemes.length === 0 && memes.length > 0) {
        const randomMemes = [...memes]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)

        return apiResponse({
          matches: randomMemes,
          message: 'Showing random memes (no context matches found)',
          provider: 'random',
          providerName: 'Random Selection'
        })
      }

      return apiResponse({
        matches: topMemes,
        message: 'Using keyword matching (AI provider unavailable)',
        provider: 'keyword',
        providerName: 'Keyword Matching'
      })
    }

  } catch (error) {
    console.error('Failed to match memes:', error)
    return apiError('Failed to match memes', 500)
  }
}