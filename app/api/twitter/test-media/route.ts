import { NextRequest } from 'next/server'
import { auth, exchangeTwitterRefreshToken } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { memeId } = await request.json()

    if (!memeId) {
      return apiError('Meme ID is required', 400)
    }

    const session = await auth()
    if (!session?.accessToken) {
      return apiError('Not authenticated with Twitter', 401)
    }

    if ((session as any).tokenError === 'RefreshAccessTokenError') {
      return apiError('Twitter authentication expired. Please reconnect your account.', 401)
    }

    // Get meme details from database
    const meme = await prisma.meme.findUnique({
      where: { id: memeId }
    })

    if (!meme) {
      return apiError('Meme not found', 404)
    }

    console.log('Testing media upload for meme:', meme.filename)

    // Read the meme file
    const fs = require('fs')
    const path = require('path')
    const memeFilePath = path.join(process.cwd(), 'storage', 'memes', meme.filename)

    if (!fs.existsSync(memeFilePath)) {
      return apiError('Meme file not found on disk', 404)
    }

    const memeBuffer = fs.readFileSync(memeFilePath)
    console.log('Meme file size:', memeBuffer.length, 'bytes')

    const { uploadMediaWithOAuth2 } = await import('@/lib/twitter-media-v2')

    const attemptUpload = async (accessToken: string) => {
      return uploadMediaWithOAuth2(
        memeBuffer,
        meme.filename,
        accessToken
      )
    }

    try {
      let accessToken = session.accessToken as string
      let mediaUploadResult = await attemptUpload(accessToken)

      if (!mediaUploadResult && session.refreshToken) {
        try {
          const refreshedTokens = await exchangeTwitterRefreshToken(session.refreshToken as string)
          accessToken = refreshedTokens.accessToken
          session.accessToken = refreshedTokens.accessToken
          if (refreshedTokens.refreshToken) {
            session.refreshToken = refreshedTokens.refreshToken
          }
          ;(session as any).accessTokenExpires = Date.now() + refreshedTokens.expiresIn * 1000
          mediaUploadResult = await attemptUpload(accessToken)
        } catch (refreshError) {
          console.error('Twitter token refresh failed:', refreshError)
        }
      }

      if (mediaUploadResult?.mediaId) {
        return apiResponse({
          success: true,
          mediaId: mediaUploadResult.mediaId,
          mediaKey: mediaUploadResult.mediaKey,
          meme: {
            id: meme.id,
            filename: meme.filename,
            size: memeBuffer.length
          }
        })
      } else {
        return apiError('Media upload failed - ensure your token has media.write scope', 500)
      }
    } catch (error) {
      console.error('Media upload test error:', error)
      return apiError(`Media upload test failed: ${error}`, 500)
    }

  } catch (error) {
    console.error('Media upload test error:', error)
    return apiError(`Media upload test failed: ${error}`, 500)
  }
}
