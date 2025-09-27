import { NextRequest } from 'next/server'
import { apiResponse, apiError } from '@/lib/utils'
import { TwitterApi } from '@/lib/twitter-api'

export async function GET(request: NextRequest) {
  try {
    const bearerToken = TwitterApi.getNormalizedBearerToken()

    if (!bearerToken) {
      return apiError('TWITTER_BEARER_TOKEN not found in environment variables', 400)
    }

    const { searchParams } = new URL(request.url)
    const tweetId = searchParams.get('tweetId') || '20' // Default to Jack's first tweet
    const testTweetId = tweetId

    console.log('Testing Twitter API with Bearer Token...')
    console.log('Token exists:', !!bearerToken)
    console.log('Token preview:', `${bearerToken.substring(0, 6)}…${bearerToken.slice(-4)}`)

    const response = await fetch(
      `https://api.twitter.com/2/tweets/${testTweetId}?expansions=author_id&user.fields=username,name`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const responseText = await response.text()
    console.log('API Response Status:', response.status)
    console.log('API Response:', responseText)

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      return apiResponse({
        status: 'error',
        message: 'Failed to parse response',
        httpStatus: response.status,
        response: responseText
      })
    }

    if (!response.ok) {
      let message = 'Twitter API returned error'
      if (response.status === 401) {
        message = 'Twitter API authentication failed (401). Verify that TWITTER_BEARER_TOKEN is valid and has Read access.'
      } else if (response.status === 429) {
        message = 'Twitter API rate limit exceeded. Wait for the reset and retry.'
      }

      return apiResponse({
        status: 'error',
        message,
        httpStatus: response.status,
        errors: data.errors || data,
        detail: data.detail || 'No details provided',
        rateLimit: {
          limit: response.headers.get('x-rate-limit-limit'),
          remaining: response.headers.get('x-rate-limit-remaining'),
          reset: response.headers.get('x-rate-limit-reset')
        }
      })
    }

    return apiResponse({
      status: 'success',
      message: 'Twitter API is working!',
      data: data,
      tokenConfigured: true
    })

  } catch (error) {
    console.error('Test API error:', error)
    return apiError(`Test failed: ${error}`, 500)
  }
}
