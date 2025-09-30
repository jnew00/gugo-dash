import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

type MemeRecord = Awaited<ReturnType<typeof prisma.meme.findMany>>[number]

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

async function callDeepSeek(prompt: string): Promise<string> {
  const apiBase = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1'
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey || apiKey === 'your-deepseek-api-key-here') {
    throw new Error('DeepSeek API key not configured')
  }

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
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`DeepSeek request failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || 'none'
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    throw new Error('OpenAI API key not configured')
  }

  const model = process.env.OPENAI_MEME_MODEL || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || 'none'
}

async function callLocalLLM(prompt: string): Promise<string> {
  const baseUrl = process.env.LOCAL_LLM_BASE || 'http://127.0.0.1:1234'
  const model = process.env.LOCAL_TEXT_MODEL || process.env.LOCAL_LLM_MODEL || 'openai/gpt-oss-20b'

  const systemPrompt = 'You are a meme recommendation assistant for the GUGO social team. Given a tweet and a list of memes with descriptions, return the IDs of the top three memes that best fit the tweet. Respond with a comma-separated list of IDs, or the word "none" if no memes match.'

  // Try OpenAI-compatible endpoint first (LM Studio style)
  try {
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        max_tokens: 150,
        temperature: 0.3
      })
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content?.trim()
      if (content) {
        return content
      }
    } else {
      const errorText = await response.text()
      console.error('Local LLM /v1/chat/completions error:', response.status, errorText || response.statusText)
    }
  } catch (error) {
    console.error('Local LLM /v1/chat/completions request failed:', error)
  }

  // Fallback to Ollama-compatible /api/generate endpoint
  const fallbackResponse = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.3,
        max_tokens: 150
      }
    })
  })

  if (!fallbackResponse.ok) {
    const errorText = await fallbackResponse.text()
    throw new Error(`Local LLM request failed: ${fallbackResponse.status} ${errorText || fallbackResponse.statusText}`)
  }

  const data = await fallbackResponse.json()
  const content: string | undefined = data?.response?.trim()
  return content && content.length > 0 ? content : 'none'
}

function parseRecommendations(recommendations: string, memes: MemeRecord[]): string[] {
  if (!recommendations) {
    return []
  }

  const normalized = recommendations.trim().toLowerCase()
  if (normalized === 'none') {
    return []
  }

  const memeIdSet = new Set(memes.map(meme => meme.id))

  // Attempt to extract IDs by looking for known meme IDs in the response while preserving order of appearance
  const occurrences = memes
    .map(meme => ({
      id: meme.id,
      index: recommendations.indexOf(meme.id)
    }))
    .filter(entry => entry.index !== -1)
    .sort((a, b) => a.index - b.index)

  if (occurrences.length > 0) {
    return occurrences.slice(0, 6).map(entry => entry.id)
  }

  // Fallback: split by comma/line and filter valid IDs
  const potentialIds = recommendations
    .split(/[,\n]/)
    .map(token => token.trim())
    .filter(token => memeIdSet.has(token))

  if (potentialIds.length > 0) {
    return potentialIds.slice(0, 6)
  }

  // Final fallback: match cuid-like tokens
  const cuidMatches = recommendations.match(/[a-z0-9]{10,}/gi) || []
  const cuidIds = cuidMatches.filter(token => memeIdSet.has(token))

  return cuidIds.slice(0, 6)
}

async function getRecommendations(provider: string, prompt: string): Promise<string> {
  switch (provider) {
    case 'deepseek':
      return await callDeepSeek(prompt)
    case 'openai':
      return await callOpenAI(prompt)
    case 'local':
      return await callLocalLLM(prompt)
    case 'keyword':
    case 'random':
      // These are handled explicitly outside
      throw new Error(`Provider ${provider} handled separately`)
    default:
      throw new Error(`Unknown meme match provider: ${provider}`)
  }
}

function buildMatchingPrompt(tweetText: string, tweetAuthor: string | undefined, memeDescriptions: string): string {
  return `
Tweet: "${tweetText}"
Author: ${tweetAuthor || 'Unknown'}

Available memes (focus on descriptions for relevance):
${memeDescriptions}

Analyze the tweet content and recommend the top 6 most relevant memes from the list above. Focus heavily on:
1. Description relevance to tweet content/emotion
2. Situational match (what's happening in the meme vs tweet context)
3. Emotional tone alignment
4. Humor potential and timing

Prioritize memes with detailed descriptions that match the tweet's situation or emotion.

Respond with only the meme IDs in order of relevance, separated by commas. If no memes are relevant, respond with "none".
Example: id1,id2,id3,id4,id5,id6
`
}

function scoreMemes(memes: MemeRecord[], tweetText: string) {
  const tweetLower = tweetText.toLowerCase()
  const keywords = tweetLower.split(/\s+/).filter(word => word.length > 3)

  return memes.map((meme, index) => {
    const description = (meme.description || '').toLowerCase()
    const tagsText = meme.tags.join(' ').toLowerCase()
    const filename = meme.filename.toLowerCase()
    let score = 0

    keywords.forEach(keyword => {
      if (description.includes(keyword)) score += 10
      if (tagsText.includes(keyword)) score += 2
      if (filename.includes(keyword)) score += 1
    })

    const memeWords = ['win', 'lose', 'fail', 'success', 'money', 'rich', 'poor', 'run', 'gugo', 'moon', 'dump', 'pump', 'chad', 'based', 'confused', 'excited', 'happy', 'sad', 'angry', 'thinking', 'celebrating']
    memeWords.forEach(word => {
      if (tweetLower.includes(word)) {
        if (description.includes(word)) score += 8
        if (tagsText.includes(word)) score += 2
      }
    })

    if (description.includes('gugo') || meme.tags.includes('gugo') || meme.tags.includes('official')) score += 2

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

    if (meme.description && meme.description.length > 20) score += 1

    return { meme, score, index }
  }).sort((a, b) => {
    if (b.score === a.score) {
      return a.index - b.index
    }
    return b.score - a.score
  })
}

function keywordFallback(memes: MemeRecord[], tweetText: string) {
  const scoredMemes = scoreMemes(memes, tweetText)

  const topMemes = scoredMemes
    .filter(item => item.score > 0)
    .slice(0, 6)
    .map(item => item.meme)

  return topMemes
}

function randomFallback(memes: MemeRecord[]) {
  return [...memes].sort(() => Math.random() - 0.5).slice(0, 6)
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

    // If admin explicitly selected keyword or random, skip LLM entirely
    if (modelProvider === 'random') {
      const randomMemes = randomFallback(memes)
      return apiResponse({
        matches: randomMemes,
        message: 'Random selection requested by admin settings',
        provider: 'random',
        providerName: getProviderDisplayName('random')
      })
    }

    if (modelProvider === 'keyword') {
      const topMemes = keywordFallback(memes, tweetText)

      if (topMemes.length === 0 && memes.length > 0) {
        const randomMemes = randomFallback(memes)
        return apiResponse({
          matches: randomMemes,
          message: 'No keyword matches found; returning random memes',
          provider: 'random',
          providerName: getProviderDisplayName('random')
        })
      }

      return apiResponse({
        matches: topMemes,
        message: 'Keyword matching selected by admin settings',
        provider: 'keyword',
        providerName: getProviderDisplayName('keyword')
      })
    }

    try {
      const scoredForPrompt = scoreMemes(memes, tweetText)
      const sortedMemesByRelevance = scoredForPrompt.map(item => item.meme)

      const detailedLimit = Number(process.env.MEME_MATCH_FULL_LIMIT || 80)
      const detailMemes = sortedMemesByRelevance.slice(0, detailedLimit)
      const detailSet = new Set(detailMemes.map(meme => meme.id))

      const remainingMemes = memes.filter(meme => !detailSet.has(meme.id))

      const detailDescriptions = detailMemes.map(meme => {
        const desc = meme.description || 'No description'
        const truncatedDesc = desc.length > 220 ? `${desc.slice(0, 217)}...` : desc
        const tags = meme.tags.length > 0 ? ` (Tags: ${meme.tags.join(', ')})` : ''
        return `ID: ${meme.id} - ${truncatedDesc}${tags}`
      })

      const summaryEntries = remainingMemes.map(meme => {
        const tags = meme.tags.length > 0 ? meme.tags.slice(0, 8).join(', ') : 'No tags'
        return `ID: ${meme.id} - Tags: ${tags}`
      })

      const sections = []
      if (detailDescriptions.length > 0) {
        sections.push('Memes with detailed descriptions (prioritized first):\n' + detailDescriptions.join('\n'))
      }
      if (summaryEntries.length > 0) {
        sections.push('Additional memes (tags only, use if highly relevant):\n' + summaryEntries.join('\n'))
      }

      const memeDescriptions = sections.join('\n\n')
      const matchingPrompt = buildMatchingPrompt(tweetText, tweetAuthor, memeDescriptions)

      const approxTokens = Math.ceil(matchingPrompt.length / 4)
      console.log('Meme match prompt stats', {
        provider: modelProvider,
        detailedCount: detailDescriptions.length,
        summaryCount: summaryEntries.length,
        totalMemesConsidered: detailDescriptions.length + summaryEntries.length,
        promptCharacters: matchingPrompt.length,
        approxTokens
      })

      const recommendations = await getRecommendations(modelProvider, matchingPrompt)
      console.log('Meme match provider response', {
        provider: modelProvider,
        recommendations
      })

      const promptMemes = [...detailMemes, ...remainingMemes]

      const handleProviderFallback = (reason: string) => {
        console.log('Meme match provider returned no usable IDs, falling back to keyword ranking', {
          provider: modelProvider,
          reason
        })

        const fallbackMemes = keywordFallback(memes, tweetText)

        if (fallbackMemes.length === 0 && memes.length > 0) {
          const randomMemes = randomFallback(memes)
          return apiResponse({
            matches: randomMemes,
            message: 'Showing random memes (provider returned none)',
            provider: 'random',
            providerName: getProviderDisplayName('random')
          })
        }

        return apiResponse({
          matches: fallbackMemes,
          message: 'Using keyword matching (provider returned none)',
          provider: 'keyword',
          providerName: getProviderDisplayName('keyword')
        })
      }

      if (!recommendations) {
        return handleProviderFallback('empty string')
      }

      const recommendedIds = parseRecommendations(recommendations, promptMemes)
      if (recommendedIds.length === 0) {
        return handleProviderFallback('unable to parse IDs')
      }

      if (recommendedIds.length < 6) {
        const supplementIds: string[] = []
        const recommendedSet = new Set(recommendedIds)

        for (const meme of sortedMemesByRelevance) {
          if (supplementIds.length + recommendedIds.length >= 6) break
          if (!recommendedSet.has(meme.id)) {
            supplementIds.push(meme.id)
            recommendedSet.add(meme.id)
          }
        }

        if (supplementIds.length > 0) {
          console.log('Supplementing meme recommendations from keyword ranking', {
            provider: modelProvider,
            originalCount: recommendedIds.length,
            supplementCount: supplementIds.length
          })
        }

        recommendedIds.push(...supplementIds)
      }

      const finalIds = Array.from(new Set(recommendedIds)).slice(0, 6)

      const matchedMemes = memes.filter(meme => finalIds.includes(meme.id))
      const sortedMatches = finalIds
        .map(id => matchedMemes.find(meme => meme.id === id))
        .filter((meme): meme is MemeRecord => Boolean(meme))

      console.log('Meme match final selection', {
        provider: modelProvider,
        finalIds,
        finalCount: sortedMatches.length
      })

      return apiResponse({
        matches: sortedMatches,
        message: `Found ${sortedMatches.length} relevant memes`,
        provider: modelProvider,
        providerName: getProviderDisplayName(modelProvider)
      })

    } catch (providerError) {
      console.error('Meme matching provider error:', providerError)

      const topMemes = keywordFallback(memes, tweetText)

      if (topMemes.length === 0 && memes.length > 0) {
        const randomMemes = randomFallback(memes)
        return apiResponse({
          matches: randomMemes,
          message: 'Showing random memes (provider failed)',
          provider: 'random',
          providerName: getProviderDisplayName('random')
        })
      }

      return apiResponse({
        matches: topMemes,
        message: 'Using keyword matching (provider failed)',
        provider: 'keyword',
        providerName: getProviderDisplayName('keyword')
      })
    }

  } catch (error) {
    console.error('Failed to match memes:', error)
    return apiError('Failed to match memes', 500)
  }
}
