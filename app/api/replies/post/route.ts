import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'
import { auth, exchangeTwitterRefreshToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { tweetId, replyText, imageId } = await request.json()

    if (!tweetId || !replyText) {
      return apiError('Tweet ID and reply text are required')
    }

    // Get the user's session with Twitter tokens
    const session = await auth()

    if (!session?.accessToken) {
      return apiError('Please login with Twitter to post replies', 401)
    }

    if ((session as any).tokenError === 'RefreshAccessTokenError') {
      return apiError('Twitter authentication expired. Please reconnect your account.', 401)
    }

    // Find the tweet in our database
    const tweet = await prisma.tweet.findFirst({
      where: { tweetId }
    })

    if (!tweet) {
      return apiError('Tweet not found', 404)
    }

    // Try to post to Twitter
    let twitterReplyId = null
    let actuallyPosted = false

    try {
      const postTweet = async (accessToken: string) => {
        return fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: replyText,
            reply: {
              in_reply_to_tweet_id: tweetId,
            },
          }),
        })
      }

      let accessToken = session.accessToken as string
      let twitterResponse = await postTweet(accessToken)

      if (!twitterResponse.ok && [401, 403].includes(twitterResponse.status) && session.refreshToken) {
        try {
          const refreshedTokens = await exchangeTwitterRefreshToken(session.refreshToken as string)
          accessToken = refreshedTokens.accessToken
          session.accessToken = refreshedTokens.accessToken
          if (refreshedTokens.refreshToken) {
            session.refreshToken = refreshedTokens.refreshToken
          }
          ;(session as any).accessTokenExpires = Date.now() + refreshedTokens.expiresIn * 1000
          twitterResponse = await postTweet(accessToken)
        } catch (refreshError) {
          console.error('Twitter token refresh failed:', refreshError)
        }
      }

      if (twitterResponse.ok) {
        const twitterData = await twitterResponse.json()
        twitterReplyId = twitterData.data?.id
        actuallyPosted = true
        console.log('Successfully posted to Twitter:', twitterReplyId)
      } else {
        const errorText = await twitterResponse.text()
        console.error('Twitter API error:', errorText)

        if (twitterResponse.status === 401) {
          return apiError('Twitter authentication expired. Please reconnect your account.', 401)
        }

        if (twitterResponse.status === 403) {
          return apiError('Twitter access denied. Please check your account permissions.', 403)
        }

        return apiError('Failed to post to Twitter. Please try again.', twitterResponse.status)
      }
    } catch (twitterError) {
      console.error('Failed to post to Twitter:', twitterError)
      return apiError('Network error posting to Twitter. Please try again.', 500)
    }

    // Save the reply to our database
    const reply = await prisma.reply.create({
      data: {
        tweetId: tweet.id,
        replyText,
        imageId: imageId || undefined,
        postedAt: actuallyPosted ? new Date() : null
      }
    })

    // Update tweet status to REPLIED if successfully posted
    if (actuallyPosted) {
      await prisma.tweet.update({
        where: { id: tweet.id },
        data: { status: 'REPLIED' }
      })
    }

    return apiResponse({
      reply,
      twitterReplyId,
      posted: actuallyPosted,
      message: actuallyPosted
        ? 'Reply posted to Twitter successfully!'
        : 'Reply saved locally but failed to post to Twitter'
    })
  } catch (error) {
    console.error('Failed to post reply:', error)
    return apiError('Failed to post reply', 500)
  }
}
