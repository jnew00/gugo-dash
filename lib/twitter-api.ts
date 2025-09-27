interface TwitterApiResponse {
  data?: {
    id: string
    text: string
    author_id?: string
    public_metrics?: {
      retweet_count: number
      like_count: number
      reply_count: number
      quote_count: number
    }
  }
  includes?: {
    users?: Array<{
      id: string
      username: string
      name: string
    }>
  }
  errors?: Array<{
    title: string
    detail: string
    type: string
  }>
}

export class TwitterApi {
  private static normalizeBearerToken(rawToken: string | undefined | null): string {
    if (!rawToken) return ''

    try {
      const decoded = decodeURIComponent(rawToken)
      const unquoted = decoded.replace(/^"|"$/g, '')
      return unquoted.trim()
    } catch (error) {
      console.error('Failed to decode Twitter bearer token. Using raw value.', error)
      return rawToken.trim()
    }
  }

  private bearerToken: string
  private inMemoryCache = new Map<string, { text: string; author: string }>()

  constructor() {
    // Handle URL-encoded tokens
    this.bearerToken = TwitterApi.normalizeBearerToken(process.env.TWITTER_BEARER_TOKEN)
  }

  hasBearerToken(): boolean {
    return Boolean(this.bearerToken)
  }

  async getTweetById(tweetId: string): Promise<{ text: string; author: string } | null> {
    if (this.inMemoryCache.has(tweetId)) {
      return this.inMemoryCache.get(tweetId) ?? null
    }

    if (!this.bearerToken) {
      console.warn('Twitter Bearer Token not configured')
      return null
    }

    try {
      const response = await fetch(
        `https://api.twitter.com/2/tweets/${tweetId}?expansions=author_id&user.fields=username,name`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const status = response.status
        const statusText = response.statusText
        console.error('Twitter API error:', status, statusText)

        if (status === 401) {
          console.error('Twitter API authentication failed (401). Verify TWITTER_BEARER_TOKEN permissions and freshness.')
        }

        if (status === 429) {
          console.error('Twitter API rate limit exceeded while fetching tweet', {
            tweetId,
            remaining: response.headers.get('x-rate-limit-remaining'),
            reset: response.headers.get('x-rate-limit-reset')
          })
        }

        return null
      }

      const data: TwitterApiResponse = await response.json()

      if (data.errors) {
        console.error('Twitter API errors:', data.errors)
        return null
      }

      if (!data.data) {
        console.error('No tweet data returned')
        return null
      }

      // Get author info
      let author = 'Unknown'
      if (data.includes?.users && data.includes.users.length > 0) {
        author = data.includes.users[0].username
      }

      const result = {
        text: data.data.text,
        author: author
      }
      this.inMemoryCache.set(tweetId, result)
      return result
    } catch (error) {
      console.error('Failed to fetch tweet:', error)
      return null
    }
  }

  // Alternative method using oEmbed API (no auth required, more reliable)
  async getTweetByIdGuest(tweetId: string): Promise<{ text: string; author: string } | null> {
    if (this.inMemoryCache.has(tweetId)) {
      return this.inMemoryCache.get(tweetId) ?? null
    }

    try {
      // Try oEmbed API first - most reliable without auth
      const oembedUrl = `https://publish.twitter.com/oembed?url=https://twitter.com/i/status/${tweetId}&omit_script=true`

      const response = await fetch(oembedUrl)

      if (response.ok) {
        const data = await response.json()

        if (data && data.html) {
          // Extract text from HTML - the content is in a <p> tag
          const textMatch = data.html.match(/<p[^>]*>(.*?)<\/p>/s)
          if (textMatch) {
            // Clean up the extracted text
            let text = textMatch[1]
              .replace(/<a[^>]*href="[^"]*search[^"]*"[^>]*>(.*?)<\/a>/g, '$1') // Keep hashtag/mention text
              .replace(/<a[^>]*>(.*?)<\/a>/g, '$1') // Remove other links but keep text
              .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&mdash;/g, '—')
              .trim()

            const author = data.author_name || 'Unknown'

            const result = { text, author }
            this.inMemoryCache.set(tweetId, result)
            console.log(`Successfully extracted tweet via oEmbed: "${text}" by @${author}`)
            return result
          }
        }
      }

      // Fallback to syndication API
      const syndicationResponse = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`)

      if (!syndicationResponse.ok) {
        return null
      }

      const syndicationData = await syndicationResponse.json()

      if (syndicationData && syndicationData.text) {
        const result = {
          text: syndicationData.text,
          author: syndicationData.user?.screen_name || syndicationData.user?.name || 'Unknown'
        }
        this.inMemoryCache.set(tweetId, result)
        return result
      }

      return null
    } catch (error) {
      console.error('Failed to fetch tweet via guest method:', error)
      return null
    }
  }

  static getNormalizedBearerToken(): string {
    return TwitterApi.normalizeBearerToken(process.env.TWITTER_BEARER_TOKEN)
  }
}
