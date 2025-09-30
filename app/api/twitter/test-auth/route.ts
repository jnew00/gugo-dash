import { auth } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'
import { TwitterApi } from 'twitter-api-v2'

const appKey = process.env.TWITTER_CLIENT_ID
const appSecret = process.env.TWITTER_CLIENT_SECRET

if (!appKey || !appSecret) {
  console.warn('Twitter consumer key/secret are not configured. Auth tests will fail until they are set.')
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.accessToken || !(session as any).accessTokenSecret) {
      return apiError('Not authenticated with Twitter', 401)
    }

    if (!appKey || !appSecret) {
      return apiError('Twitter credentials are not configured on the server', 500)
    }

    const twitterClient = new TwitterApi({
      appKey,
      appSecret,
      accessToken: session.accessToken as string,
      accessSecret: (session as any).accessTokenSecret as string,
    })

    const userData = await twitterClient.v1.verifyCredentials()

    let tweetsData: any = null
    let tweetsResponseStatus = null

    try {
      const timeline = await twitterClient.v2.userTimeline(userData.id_str, {
        max_results: 5,
        "tweet.fields": ['id', 'text', 'created_at'],
      })
      tweetsData = timeline.tweets
      tweetsResponseStatus = timeline.meta
    } catch (timelineError) {
      console.warn('Failed to fetch user timeline for debug test:', timelineError)
    }

    return apiResponse({
      authenticated: true,
      user: userData,
      tweetsMeta: tweetsResponseStatus,
      tweets: tweetsData,
      tokens: {
        accessTokenPreview: session.accessToken ? `${(session.accessToken as string).substring(0, 4)}…${(session.accessToken as string).slice(-4)}` : 'Missing',
        accessTokenSecretPreview: (session as any).accessTokenSecret
          ? `${((session as any).accessTokenSecret as string).substring(0, 4)}…${((session as any).accessTokenSecret as string).slice(-4)}`
          : 'Missing'
      },
      sessionData: {
        username: session.username,
        twitterId: session.twitterId
      }
    })

  } catch (error) {
    console.error('Auth test error:', error)
    return apiError(`Auth test failed: ${error}`, 500)
  }
}
