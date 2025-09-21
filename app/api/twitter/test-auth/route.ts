import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.accessToken) {
      return apiError('Not authenticated with Twitter', 401)
    }

    if ((session as any).tokenError === 'RefreshAccessTokenError') {
      return apiError('Twitter authentication expired. Please reconnect your account.', 401)
    }

    // Test posting permissions by checking if we can access user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const userData = await userResponse.json()

    // Test if we can read tweets (basic permission)
    const tweetsResponse = await fetch('https://api.twitter.com/2/users/me/tweets?max_results=5', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const tweetsData = await tweetsResponse.json()

    return apiResponse({
      authenticated: true,
      tokenError: (session as any).tokenError,
      user: userData,
      userResponseStatus: userResponse.status,
      tweetsResponseStatus: tweetsResponse.status,
      tweetsData: tweetsData,
      tokens: {
        accessTokenPreview: session.accessToken ? `${(session.accessToken as string).substring(0, 4)}…${(session.accessToken as string).slice(-4)}` : 'Missing',
        refreshTokenPresent: Boolean(session.refreshToken)
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
