import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'
import { TwitterApi } from '@/lib/twitter-api'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get the tweet from database
    const tweet = await prisma.tweet.findUnique({
      where: { id }
    })

    if (!tweet) {
      return apiError('Tweet not found', 404)
    }

    const url = new URL(request.url)
    const forceRefresh = url.searchParams.get('force') === 'true'
    const isPlaceholder = !tweet.tweetText ||
      tweet.tweetText.includes('Sample tweet content') ||
      tweet.tweetText.includes('will be replaced') ||
      tweet.tweetText.includes('[Tweet content not available')

    if (!forceRefresh && !isPlaceholder) {
      return apiResponse({
        tweet,
        message: 'Tweet already cached locally. Pass ?force=true to refresh from Twitter.',
        cached: true
      })
    }

    const twitterApi = new TwitterApi()

    try {
      const guestData = await twitterApi.getTweetByIdGuest(tweet.tweetId)
      const authData = guestData ?? (twitterApi.hasBearerToken() ? await twitterApi.getTweetById(tweet.tweetId) : null)

      if (!authData) {
        return apiError(
          twitterApi.hasBearerToken()
            ? 'Unable to retrieve tweet content from Twitter right now. You may be rate limited; try again later.'
            : 'Unable to retrieve tweet content without a configured Twitter bearer token.',
          twitterApi.hasBearerToken() ? 429 : 500
        )
      }

      const updatedTweet = await prisma.tweet.update({
        where: { id },
        data: {
          tweetText: authData.text,
          author: authData.author !== 'Unknown' ? authData.author : tweet.author
        }
      })

      return apiResponse({
        tweet: updatedTweet,
        message: 'Tweet content updated successfully',
        refreshed: true,
        usedGuestEndpoint: Boolean(guestData)
      })
    } catch (twitterError) {
      console.error('Failed to refresh tweet via Twitter API:', twitterError)

      if (!twitterApi.hasBearerToken()) {
        return apiError('Twitter Bearer token not configured for authenticated fallback.', 500)
      }

      return apiError('Failed to refresh tweet from Twitter API', 502)
    }
  } catch (error) {
    console.error('Failed to refresh tweet:', error)
    return apiError('Failed to refresh tweet', 500)
  }
}
