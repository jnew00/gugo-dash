import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'
import { auth } from '@/lib/auth'
import { TwitterApi } from 'twitter-api-v2'
import path from 'path'
import { promises as fs } from 'fs'

const appKey = process.env.TWITTER_CLIENT_ID
const appSecret = process.env.TWITTER_CLIENT_SECRET

if (!appKey || !appSecret) {
  console.warn('Twitter consumer key/secret are not configured. Tweeting will fail until they are set.')
}

export async function POST(request: NextRequest) {
  try {
    const { tweetId, replyText, imageId, memeId } = await request.json()

    if (!tweetId || !replyText) {
      return apiError('Tweet ID and reply text are required')
    }

    const session = await auth()

    if (!session?.accessToken || !(session as any).accessTokenSecret) {
      return apiError('Please login with Twitter to post replies', 401)
    }

    if (!appKey || !appSecret) {
      return apiError('Twitter credentials are not configured on the server', 500)
    }

    const tweet = await prisma.tweet.findFirst({
      where: { tweetId }
    })

    if (!tweet) {
      return apiError('Tweet not found', 404)
    }

    const twitterClient = new TwitterApi({
      appKey,
      appSecret,
      accessToken: session.accessToken as string,
      accessSecret: (session as any).accessTokenSecret as string,
    }).readWrite

    const mediaIds: string[] = []
    let storedImagePath: string | null = null
    let storedImageUrl: string | null = null

    const loadMediaBuffer = async (storedPath: string | null | undefined, fallbackSegments: string[], filename: string) => {
      const candidates: string[] = []

      if (storedPath) {
        if (/^https?:\/\//i.test(storedPath)) {
          const response = await fetch(storedPath)
          if (!response.ok) {
            throw new Error(`Failed to download remote media: ${response.status} ${response.statusText}`)
          }
          const arrayBuffer = await response.arrayBuffer()
          return { buffer: Buffer.from(arrayBuffer), resolvedPath: storedPath }
        }

        const normalized = storedPath.startsWith('/') ? storedPath.slice(1) : storedPath
        candidates.push(path.isAbsolute(normalized) ? normalized : path.join(process.cwd(), normalized))
      }

      candidates.push(path.join(process.cwd(), ...fallbackSegments))

      for (const candidate of candidates) {
        try {
          const buffer = await fs.readFile(candidate)
          return { buffer, resolvedPath: candidate }
        } catch (error) {
          // Try next candidate
        }
      }

      throw new Error(`Unable to locate media file for ${filename}`)
    }

    const getMimeType = (filename: string) => {
      const extension = filename.split('.').pop()?.toLowerCase()
      switch (extension) {
        case 'png':
          return 'image/png'
        case 'gif':
          return 'image/gif'
        case 'webp':
          return 'image/webp'
        case 'bmp':
          return 'image/bmp'
        default:
          return 'image/jpeg'
      }
    }

    try {
      if (imageId) {
        const baseImage = await prisma.baseImage.findUnique({ where: { id: imageId } })
        if (!baseImage) {
          return apiError('Selected image not found', 404)
        }

        const { buffer, resolvedPath } = await loadMediaBuffer(
          baseImage.path,
          ['storage', 'base_images', baseImage.filename],
          baseImage.filename
        )

        const mimeType = getMimeType(baseImage.filename)
        console.log('Uploading base image to Twitter', { imageId, resolvedPath, mimeType })
        const mediaId = await twitterClient.v1.uploadMedia(buffer, { mimeType })
        mediaIds.push(mediaId)
        storedImagePath = baseImage.path || resolvedPath
        storedImageUrl = baseImage.path || storedImageUrl
      }

      if (memeId) {
        const meme = await prisma.meme.findUnique({ where: { id: memeId } })
        if (!meme) {
          return apiError('Selected meme not found', 404)
        }

        const { buffer, resolvedPath } = await loadMediaBuffer(
          meme.path,
          ['storage', 'memes', meme.filename],
          meme.filename
        )

        const mimeType = getMimeType(meme.filename)
        console.log('Uploading meme to Twitter', { memeId, resolvedPath, mimeType })
        const mediaId = await twitterClient.v1.uploadMedia(buffer, { mimeType })
        mediaIds.push(mediaId)
        storedImagePath = meme.path || resolvedPath
        storedImageUrl = meme.path || storedImageUrl
      }
    } catch (mediaError) {
      console.error('Failed to upload media to Twitter:', mediaError)
      return apiError('Failed to upload media to Twitter. Please try again.', 500)
    }

    let twitterReplyId: string | null = null
    let actuallyPosted = false

    try {
      const response = await twitterClient.v2.tweet({
        text: replyText,
        reply: {
          in_reply_to_tweet_id: tweetId,
        },
        ...(mediaIds.length > 0 ? { media: { media_ids: mediaIds } } : {}),
      })

      twitterReplyId = response.data?.id ?? null
      actuallyPosted = Boolean(twitterReplyId)
      console.log('Successfully posted to Twitter:', twitterReplyId, mediaIds.length ? { mediaIds } : undefined)
    } catch (twitterError: any) {
      console.error('Failed to post to Twitter:', twitterError)

      const status = twitterError?.code ?? twitterError?.data?.status ?? 500

      if (status === 401) {
        return apiError('Twitter authentication failed. Please reconnect your account.', 401)
      }

      if (status === 403) {
        return apiError('Twitter access denied. Please check your account permissions.', 403)
      }

      const message = twitterError?.data?.detail || 'Failed to post to Twitter. Please try again.'
      return apiError(message, typeof status === 'number' ? status : 500)
    }

    const reply = await prisma.reply.create({
      data: {
        tweetId: tweet.id,
        replyText,
        imageId: imageId || undefined,
        memeId: memeId || undefined,
        imagePath: storedImagePath || undefined,
        imageUrl: storedImageUrl || undefined,
        twitterReplyId: actuallyPosted ? twitterReplyId : null,
        postedAt: actuallyPosted ? new Date() : null
      }
    })

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
