import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, extractTweetId, extractAuthorFromUrl, isValidTwitterUrl } from '@/lib/utils'
import { TwitterApi } from '@/lib/twitter-api'

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
    let author = extractAuthorFromUrl(url)
    
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

    const twitterApi = new TwitterApi()

    // Fetch actual tweet content using Twitter API (guest endpoints first to avoid rate limits)
    let tweetText = `Sample tweet content for ${author} - This will be replaced with actual tweet content when Twitter API is configured.`

    try {
      const guestData = await twitterApi.getTweetByIdGuest(tweetId)
      if (guestData?.text) {
        tweetText = guestData.text
        if (guestData.author && guestData.author !== 'Unknown') {
          author = guestData.author
        }
      } else {
        const authData = await twitterApi.getTweetById(tweetId)
        if (authData?.text) {
          tweetText = authData.text
          if (authData.author && authData.author !== 'Unknown') {
            author = authData.author
          }
        }
      }
    } catch (twitterError) {
      console.error('Failed to fetch tweet while creating record:', twitterError)
      // Continue with placeholder text if API fails
    }

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
