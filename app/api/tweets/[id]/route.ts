import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tweet = await prisma.tweet.findUnique({
      where: { id: params.id },
      include: {
        replies: {
          include: {
            baseImage: true
          }
        }
      }
    })
    
    if (!tweet) {
      return apiError('Tweet not found', 404)
    }
    
    return apiResponse({ tweet })
  } catch (error) {
    console.error('Failed to fetch tweet:', error)
    return apiError('Failed to fetch tweet', 500)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { status } = await request.json()
    
    if (!status || !['NEW', 'REPLIED', 'SKIPPED'].includes(status)) {
      return apiError('Valid status is required (NEW, REPLIED, or SKIPPED)')
    }
    
    const tweet = await prisma.tweet.update({
      where: { id: params.id },
      data: { status, updatedAt: new Date() }
    })
    
    return apiResponse({ tweet })
  } catch (error) {
    console.error('Failed to update tweet:', error)
    return apiError('Failed to update tweet', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await prisma.tweet.delete({
      where: { id: params.id }
    })
    
    return apiResponse({ message: 'Tweet deleted successfully' })
  } catch (error) {
    console.error('Failed to delete tweet:', error)
    return apiError('Failed to delete tweet', 500)
  }
}