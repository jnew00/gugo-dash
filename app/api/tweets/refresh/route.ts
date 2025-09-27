import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'
import { TwitterApi } from '@/lib/twitter-api'

export async function POST(request: NextRequest) {
  try {
    // Get all tweets that have placeholder content
    const tweets = await prisma.tweet.findMany({
      where: {
        OR: [
          { tweetText: { contains: 'Sample tweet content' } },
          { tweetText: { contains: 'will be replaced' } },
          { tweetText: { contains: '[Tweet content not available' } }
        ]
      }
    })

    if (tweets.length === 0) {
      return apiResponse({
        message: 'No tweets need updating',
        updated: 0
      })
    }

    const twitterApi = new TwitterApi()
    let updatedCount = 0
    const errors = []

    for (const tweet of tweets) {
      try {
        let newText = ''
        let newAuthor = tweet.author

        // Prefer guest endpoints to avoid burning authenticated rate limits
        const guestData = await twitterApi.getTweetByIdGuest(tweet.tweetId)
        if (guestData) {
          newText = guestData.text
          newAuthor = guestData.author
        } else {
          const tweetData = await twitterApi.getTweetById(tweet.tweetId)
          if (tweetData) {
            newText = tweetData.text
            newAuthor = tweetData.author
          }
        }

        if (newText) {
          await prisma.tweet.update({
            where: { id: tweet.id },
            data: {
              tweetText: newText,
              author: newAuthor
            }
          })
          updatedCount++
          console.log(`Updated tweet ${tweet.tweetId}: ${newText.substring(0, 50)}...`)
        } else {
          errors.push(`Could not fetch content for tweet ${tweet.tweetId}`)
        }

      } catch (error) {
        console.error(`Error updating tweet ${tweet.id}:`, error)
        errors.push(`Error updating tweet ${tweet.tweetId}: ${error}`)
      }
    }

    return apiResponse({
      message: `Updated ${updatedCount} out of ${tweets.length} tweets`,
      updated: updatedCount,
      total: tweets.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Failed to refresh tweets:', error)
    return apiError('Failed to refresh tweets', 500)
  }
}
