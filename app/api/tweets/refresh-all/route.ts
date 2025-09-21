import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse } from '@/lib/utils'
import { TwitterApi } from '@/lib/twitter-api'

export async function POST(request: NextRequest) {
  const twitterApi = new TwitterApi()
  const results = {
    success: [] as any[],
    failed: [] as any[],
    skipped: [] as any[]
  }

  // Get all tweets
  const tweets = await prisma.tweet.findMany({
    orderBy: { createdAt: 'desc' }
  })

  for (const tweet of tweets) {
    // Skip if already has good content
    if (tweet.tweetText &&
        !tweet.tweetText.includes('[Tweet content not available') &&
        !tweet.tweetText.includes('Sample tweet content')) {
      results.skipped.push({
        id: tweet.id,
        author: tweet.author,
        reason: 'Already has content'
      })
      continue
    }

    try {
      // Try guest/oEmbed method
      const data = await twitterApi.getTweetByIdGuest(tweet.tweetId)

      if (data && data.text) {
        await prisma.tweet.update({
          where: { id: tweet.id },
          data: {
            tweetText: data.text,
            author: data.author
          }
        })

        results.success.push({
          id: tweet.id,
          author: data.author,
          text: data.text.substring(0, 50) + '...'
        })
      } else {
        results.failed.push({
          id: tweet.id,
          tweetId: tweet.tweetId,
          url: tweet.tweetUrl,
          reason: 'No data returned from API'
        })
      }
    } catch (error) {
      results.failed.push({
        id: tweet.id,
        tweetId: tweet.tweetId,
        url: tweet.tweetUrl,
        reason: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return apiResponse({
    summary: {
      total: tweets.length,
      updated: results.success.length,
      failed: results.failed.length,
      skipped: results.skipped.length
    },
    results
  })
}