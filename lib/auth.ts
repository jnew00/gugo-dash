import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import type { JWT } from 'next-auth/jwt'
import { getServerSession } from 'next-auth'
import { errors } from 'openid-client'

interface TwitterJWT extends JWT {
  accessToken?: string
  refreshToken?: string
  accessTokenExpires?: number
  username?: string
  twitterId?: string
  tokenType?: string
  error?: string
}

interface RefreshedTokens {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType?: string
}

async function exchangeTwitterRefreshToken(refreshToken: string): Promise<RefreshedTokens> {
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Twitter client credentials not configured')
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  const refreshed = await response.json()

  if (!response.ok) {
    const errorMessage = refreshed?.error_description || refreshed?.error || response.statusText
    throw new Error(`Twitter token refresh failed: ${errorMessage}`)
  }

  return {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresIn: refreshed.expires_in,
    tokenType: refreshed.token_type,
  }
}

async function refreshTwitterAccessToken(token: TwitterJWT): Promise<TwitterJWT> {
  try {
    if (!token.refreshToken) {
      throw new Error('Missing refresh token')
    }

    const refreshedTokens = await exchangeTwitterRefreshToken(token.refreshToken)

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + refreshedTokens.expiresIn * 1000,
      tokenType: refreshedTokens.tokenType ?? token.tokenType,
      error: undefined,
    }
  } catch (error) {
    console.error('Error refreshing Twitter access token:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

const twitterProvider = TwitterProvider({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  version: '2.0',
  authorization: {
    url: 'https://twitter.com/i/oauth2/authorize',
  params: {
    scope: 'tweet.read tweet.write users.read offline.access',
  },
  },
  userinfo: {
    async request({ client, tokens }) {
      const maxAttempts = 3
      let lastError: unknown = null

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          return await client.userinfo(tokens)
        } catch (err) {
          lastError = err

          if (err instanceof errors.OPError && err.response?.statusCode === 429) {
            const responseBody = (() => {
              try {
                return err.response?.body ? JSON.parse(err.response.body.toString()) : null
              } catch (parseError) {
                return err.response?.body?.toString() ?? null
              }
            })()

            console.warn('Twitter userinfo rate limit response:', responseBody)

            const retryAfterHeader = err.response.headers?.['retry-after']
            const retryAfterSecondsRaw = Array.isArray(retryAfterHeader)
              ? parseInt(retryAfterHeader[0] ?? '', 10)
              : typeof retryAfterHeader === 'string'
                ? parseInt(retryAfterHeader, 10)
                : NaN

            const delayMs = Number.isFinite(retryAfterSecondsRaw) && retryAfterSecondsRaw > 0
              ? retryAfterSecondsRaw * 1000
              : (attempt + 1) * 1000

            console.warn(`Twitter userinfo rate limited (attempt ${attempt + 1}/${maxAttempts}). Retrying in ${delayMs}ms.`)

            await new Promise((resolve) => setTimeout(resolve, delayMs))
            continue
          }

          throw err
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error('Twitter userinfo failed and no additional error details were provided')
    },
  },
  profile(rawProfile) {
    const data = (rawProfile as any)?.data ?? rawProfile ?? {}
    const id = data.id ?? (rawProfile as any)?.sub

    if (!id) {
      throw new Error('Unable to resolve Twitter user id from profile response')
    }

    return {
      id: id.toString(),
      name: data.name ?? (rawProfile as any)?.name ?? null,
      email: null,
      image: data.profile_image_url ?? (rawProfile as any)?.picture ?? null,
      username: data.username ?? data.preferred_username ?? data.screen_name ?? null,
    }
  },
})

const authOptions: NextAuthOptions = {
  providers: [twitterProvider],
  callbacks: {
    async jwt({ token, account, profile }) {
      let twitterToken = token as TwitterJWT

      if (account) {
        const expiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + (account.expires_in ?? 3600) * 1000

        twitterToken = {
          ...twitterToken,
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? twitterToken.refreshToken,
          accessTokenExpires: expiresAt,
          tokenType: account.token_type ?? twitterToken.tokenType,
          username:
            (profile as any)?.data?.username ||
            (profile as any)?.username ||
            (profile as any)?.preferred_username ||
            twitterToken.username,
          twitterId:
            (profile as any)?.data?.id ||
            (profile as any)?.id ||
            account.providerAccountId ||
            twitterToken.twitterId,
          error: undefined,
        }

        return twitterToken
      }

      if (twitterToken.accessToken && twitterToken.accessTokenExpires && Date.now() < twitterToken.accessTokenExpires - 60_000) {
        return twitterToken
      }

      return await refreshTwitterAccessToken(twitterToken)
    },
    async session({ session, token }) {
      const twitterToken = token as TwitterJWT

      return {
        ...session,
        accessToken: twitterToken.accessToken,
        refreshToken: twitterToken.refreshToken,
        accessTokenExpires: twitterToken.accessTokenExpires,
        username: twitterToken.username,
        twitterId: twitterToken.twitterId,
        tokenError: twitterToken.error,
      }
    },
  },
}

export default NextAuth(authOptions)
export { authOptions, refreshTwitterAccessToken, exchangeTwitterRefreshToken }

export const auth = () => getServerSession(authOptions)
