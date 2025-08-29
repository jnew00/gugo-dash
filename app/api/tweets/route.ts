import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, extractTweetId, extractAuthorFromUrl, isValidTwitterUrl } from '@/lib/utils'

export async function GET() {
  try {
    const tweets = await prisma.tweet.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        replies: {
          select: { id: true, createdAt: true, postedAt: true }
        }
      }
    })
    
    return apiResponse({ tweets })
  } catch (error) {
    console.error('Failed to fetch tweets:', error)
    return apiError('Failed to fetch tweets', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url || typeof url !== 'string') {
      return apiError('URL is required')
    }
    
    if (!isValidTwitterUrl(url)) {
      return apiError('Invalid Twitter/X URL format')
    }
    
    const tweetId = extractTweetId(url)
    const author = extractAuthorFromUrl(url)
    
    if (!tweetId) {
      return apiError('Could not extract tweet ID from URL')
    }
    
    if (!author) {
      return apiError('Could not extract author from URL')
    }
    
    const existingTweet = await prisma.tweet.findUnique({
      where: { tweetUrl: url }
    })
    
    if (existingTweet) {
      return apiError('Tweet already exists', 409)
    }
    
    // For now, we'll use placeholder text since we don't have Twitter API setup yet
    const tweetText = `Sample tweet content for ${author} - This will be replaced with actual tweet content when Twitter API is configured.`
    
    const tweet = await prisma.tweet.create({
      data: {
        tweetUrl: url,
        tweetId,
        author,
        tweetText,
        source: 'MANUAL',
        status: 'NEW'
      }
    })
    
    return apiResponse({ tweet }, 201)
  } catch (error) {
    console.error('Failed to create tweet:', error)
    return apiError('Failed to create tweet', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return apiError('Tweet ID is required')
    }
    
    await prisma.tweet.delete({
      where: { id }
    })
    
    return apiResponse({ message: 'Tweet deleted successfully' })
  } catch (error) {
    console.error('Failed to delete tweet:', error)
    return apiError('Failed to delete tweet', 500)
  }
}