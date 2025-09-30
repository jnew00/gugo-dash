import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import type { JWT } from 'next-auth/jwt'
import { getServerSession } from 'next-auth'

interface TwitterJWT extends JWT {
  accessToken?: string
  accessTokenSecret?: string
  username?: string
  twitterId?: string
}

type LegacyProfile = {
  id_str?: string
  name?: string
  email?: string
  screen_name?: string
  profile_image_url_https?: string
}

const twitterProvider = TwitterProvider({
  version: '1.0A',
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  profile(rawProfile) {
    const profile = rawProfile as LegacyProfile
    const image = typeof profile.profile_image_url_https === 'string'
      ? profile.profile_image_url_https.replace(/_normal\.(jpg|png|gif)$/i, '.$1')
      : profile.profile_image_url_https

    return {
      id: profile.id_str ?? '',
      name: profile.name ?? null,
      email: profile.email ?? null,
      image: image ?? null,
      username: profile.screen_name ?? null,
    }
  },
})

const authOptions: NextAuthOptions = {
  providers: [twitterProvider],
  callbacks: {
    async jwt({ token, account, profile }) {
      const twitterToken = token as TwitterJWT

      if (!account) {
        return twitterToken
      }

      return {
        ...twitterToken,
        accessToken: (account as any).oauth_token ?? twitterToken.accessToken,
        accessTokenSecret: (account as any).oauth_token_secret ?? twitterToken.accessTokenSecret,
        username:
          (profile as any)?.username ||
          (profile as any)?.screen_name ||
          twitterToken.username,
        twitterId:
          (profile as any)?.id_str ||
          account.providerAccountId ||
          twitterToken.twitterId,
      }
    },
    async session({ session, token }) {
      const twitterToken = token as TwitterJWT

      return {
        ...session,
        accessToken: twitterToken.accessToken,
        accessTokenSecret: twitterToken.accessTokenSecret,
        username: twitterToken.username,
        twitterId: twitterToken.twitterId,
      }
    },
  },
}

export default NextAuth(authOptions)
export { authOptions }

export const auth = () => getServerSession(authOptions)
