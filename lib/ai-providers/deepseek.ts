interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export class DeepSeekProvider {
  private apiKey: string
  private baseUrl = 'https://api.deepseek.com/v1/chat/completions'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('DeepSeek API key is required')
    }
  }

  async generateReply(tweetText: string, tweetAuthor: string): Promise<string[]> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: `You are the voice of GUGO - a bold, athletic community that embodies the spirit of running and movement.

        GUGO VOICE CHARACTERISTICS:
        - Short, punchy sentences
        - Rhythmic, almost poetic structure
        - Powerful, repetitive phrasing
        - Minimalist but impactful
        - Running/movement metaphors when relevant
        - "We run. We GUGO." as core philosophy

        GUGO STYLE EXAMPLE:
        "He didn't ask to be born.
        He didn't ask to be followed.
        He just ran.

        And for some reason…
        we followed.

        This is GUGO.
        He runs.
        We GUGO."

        REPLY REQUIREMENTS:
        - Stay under 280 characters
        - Match GUGO's bold, confident tone
        - Use short, impactful sentences
        - Be authentic and engaging
        - No hashtags unless absolutely relevant
        - Never use em-dashes (—) - use periods or line breaks for impact
        - When relevant, incorporate running/movement metaphors

        Generate exactly 3 different reply options in GUGO's distinctive style.`
      },
      {
        role: 'user',
        content: `Create engaging reply options for this tweet by @${tweetAuthor}:

"${tweetText}"

Return exactly 3 reply options, each on a separate line, numbered 1-3.`
      }
    ]

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.8,
          max_tokens: 500,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`)
      }

      const data: DeepSeekResponse = await response.json()
      const content = data.choices[0]?.message?.content || ''
      
      // Parse numbered responses
      const suggestions = content
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 3)

      return suggestions.length > 0 ? suggestions : ['Great point! Thanks for sharing your perspective.']
    } catch (error) {
      console.error('DeepSeek API error:', error)
      throw new Error('Failed to generate reply suggestions')
    }
  }
}