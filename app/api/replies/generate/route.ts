import { NextRequest } from 'next/server'
import { apiResponse, apiError } from '@/lib/utils'
import { getTextProvider } from '@/lib/ai-providers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { tweetText, tweetAuthor } = await request.json()

    if (!tweetText || !tweetAuthor) {
      return apiError('Tweet text and author are required')
    }

    // Get admin settings
    const settings = await prisma.adminSettings.findUnique({
      where: { id: 'admin' }
    })

    const providerName = settings?.textProvider || 'local'
    const provider = getTextProvider(providerName as any)
    const result = await provider.generateReply(tweetText, tweetAuthor)

    // Handle both old and new response formats
    let suggestions: string[]
    let providerInfo: string

    if (Array.isArray(result)) {
      suggestions = result
      providerInfo = getProviderDisplayName(providerName)
    } else {
      suggestions = result.suggestions
      providerInfo = result.statusMessage || getProviderDisplayName(providerName)
    }

    return apiResponse({
      suggestions,
      provider: providerInfo
    })
  } catch (error) {
    console.error('Failed to generate reply suggestions:', error)
    return apiError('Failed to generate reply suggestions', 500)
  }
}

function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case 'deepseek': return 'DeepSeek AI'
    case 'openai': return 'OpenAI GPT'
    case 'local':
      const model = process.env.LOCAL_TEXT_MODEL || process.env.LOCAL_LLM_MODEL || 'Local LLM'
      return `${model} (Local)`
    default: return 'AI Provider'
  }
}