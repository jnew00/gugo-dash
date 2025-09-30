import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { apiResponse, apiError } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { TwitterApi } from 'twitter-api-v2'
import path from 'path'
import { promises as fs } from 'fs'

const appKey = process.env.TWITTER_CLIENT_ID
const appSecret = process.env.TWITTER_CLIENT_SECRET

if (!appKey || !appSecret) {
  console.warn('Twitter consumer key/secret are not configured. Media uploads will fail until they are set.')
}

export async function POST(request: NextRequest) {
  try {
    const { memeId } = await request.json()

    if (!memeId) {
      return apiError('Meme ID is required', 400)
    }

    const session = await auth()
    if (!session?.accessToken || !(session as any).accessTokenSecret) {
      return apiError('Not authenticated with Twitter', 401)
    }

    if (!appKey || !appSecret) {
      return apiError('Twitter credentials are not configured on the server', 500)
    }

    const meme = await prisma.meme.findUnique({
      where: { id: memeId }
    })

    if (!meme) {
      return apiError('Meme not found', 404)
    }

    console.log('Testing media upload for meme:', meme.filename)

    const resolveMedia = async () => {
      const candidates: string[] = []

      if (meme.path) {
        if (/^https?:\/\//i.test(meme.path)) {
          const response = await fetch(meme.path)
          if (!response.ok) {
            throw new Error(`Failed to download remote meme: ${response.status} ${response.statusText}`)
          }
          const buffer = Buffer.from(await response.arrayBuffer())
          return { buffer, resolvedPath: meme.path }
        }

        const normalized = meme.path.startsWith('/') ? meme.path.slice(1) : meme.path
        candidates.push(path.isAbsolute(normalized) ? normalized : path.join(process.cwd(), normalized))
      }

      candidates.push(path.join(process.cwd(), 'storage', 'memes', meme.filename))

      for (const candidate of candidates) {
        try {
          const buffer = await fs.readFile(candidate)
          return { buffer, resolvedPath: candidate }
        } catch (error) {
          // try next candidate
        }
      }

      throw new Error(`Unable to locate meme file for testing (${meme.filename})`)
    }

    const { buffer: memeBuffer, resolvedPath } = await resolveMedia()
    console.log('Meme file size:', memeBuffer.length, 'bytes', { resolvedPath })

    try {
      const twitterClient = new TwitterApi({
        appKey,
        appSecret,
        accessToken: session.accessToken as string,
        accessSecret: (session as any).accessTokenSecret as string,
      }).readWrite

      const extension = meme.filename.split('.').pop()?.toLowerCase()
      const mediaType = extension === 'gif'
        ? 'image/gif'
        : extension === 'png'
          ? 'image/png'
          : extension === 'webp'
            ? 'image/webp'
            : 'image/jpeg'

      const mediaId = await twitterClient.v1.uploadMedia(memeBuffer, { mimeType: mediaType })

      if (mediaId) {
        return apiResponse({
          success: true,
          mediaId,
          meme: {
            id: meme.id,
            filename: meme.filename,
            size: memeBuffer.length
          }
        })
      }

      return apiError('Media upload failed - ensure your token has media permissions', 500)
    } catch (error: any) {
      console.error('Media upload test error:', error)
      const status = error?.code ?? error?.data?.status ?? 500
      const message = error?.data?.detail || `Media upload test failed: ${error}`
      return apiError(message, typeof status === 'number' ? status : 500)
    }

  } catch (error) {
    console.error('Media upload test error:', error)
    return apiError(`Media upload test failed: ${error}`, 500)
  }
}
