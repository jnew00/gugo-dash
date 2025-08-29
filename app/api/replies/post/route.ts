import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { tweetId, replyText, imageId } = await request.json()
    
    if (!tweetId || !replyText) {
      return apiError('Tweet ID and reply text are required')
    }
    
    // Find the tweet in our database
    const tweet = await prisma.tweet.findFirst({
      where: { tweetId }
    })
    
    if (!tweet) {
      return apiError('Tweet not found', 404)
    }
    
    // For now, we'll just save the reply to our database
    // Twitter API integration will be added later
    const reply = await prisma.reply.create({
      data: {
        tweetId: tweet.id,
        replyText,
        imageId: imageId || undefined,
        postedAt: new Date() // Mark as posted for demo purposes
      }
    })
    
    // Update tweet status to REPLIED
    await prisma.tweet.update({
      where: { id: tweet.id },
      data: { status: 'REPLIED' }
    })
    
    return apiResponse({ 
      reply,
      message: 'Reply saved successfully. Twitter API integration pending.'
    })
  } catch (error) {
    console.error('Failed to post reply:', error)
    return apiError('Failed to post reply', 500)
  }
}