import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { TwitterApi } from 'twitter-api-v2'

const appKey = process.env.TWITTER_CLIENT_ID
const appSecret = process.env.TWITTER_CLIENT_SECRET

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get the tweet and its replies from database
    const tweet = await prisma.tweet.findUnique({
      where: { id },
      include: {
        replies: {
          where: {
            postedAt: { not: null },
            twitterReplyId: { not: null }
          }, // Only get replies that were actually posted and have Twitter IDs
          orderBy: { postedAt: 'desc' },
          take: 1 // Get the most recent reply
        }
      }
    })

    if (!tweet) {
      return apiError('Tweet not found', 404)
    }

    if (!tweet.replies || tweet.replies.length === 0) {
      return apiError('No posted replies found for this tweet', 404)
    }

    const reply = tweet.replies[0]

    if (!reply.twitterReplyId) {
      return apiError('No Twitter reply ID found. This reply may have been posted before reply IDs were stored.', 404)
    }

    // Get user's Twitter auth
    const session = await auth()
    if (!session?.accessToken || !(session as any).accessTokenSecret) {
      return apiError('Please login with Twitter to delete replies', 401)
    }

    if (!appKey || !appSecret) {
      return apiError('Twitter credentials are not configured on the server', 500)
    }

    try {
      // Initialize Twitter client
      const twitterClient = new TwitterApi({
        appKey,
        appSecret,
        accessToken: session.accessToken as string,
        accessSecret: (session as any).accessTokenSecret as string,
      })

      // Delete the reply from Twitter
      await twitterClient.v2.deleteTweet(reply.twitterReplyId)

      // Update the reply in database to mark as deleted
      await prisma.reply.update({
        where: { id: reply.id },
        data: {
          twitterReplyId: null,
          postedAt: null
        }
      })

      // Update tweet status back to NEW since reply was deleted
      await prisma.tweet.update({
        where: { id: tweet.id },
        data: { status: 'NEW' }
      })

      return apiResponse({
        message: 'Reply deleted from Twitter successfully',
        replyId: reply.twitterReplyId
      })
    } catch (twitterError: any) {
      console.error('Failed to delete from Twitter:', twitterError)

      const status = twitterError?.code ?? twitterError?.data?.status ?? 500

      if (status === 401) {
        return apiError('Twitter authentication failed. Please reconnect your account.', 401)
      }

      if (status === 403) {
        return apiError('You can only delete your own tweets.', 403)
      }

      if (status === 404) {
        return apiError('Tweet not found on Twitter (may already be deleted).', 404)
      }

      const message = twitterError?.data?.detail || 'Failed to delete tweet from Twitter.'
      return apiError(message, typeof status === 'number' ? status : 500)
    }
  } catch (error) {
    console.error('Failed to delete tweet from Twitter:', error)
    return apiError('Failed to delete tweet from Twitter', 500)
  }
}