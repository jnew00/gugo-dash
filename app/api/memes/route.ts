import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const memes = await prisma.meme.findMany({
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return apiResponse(memes)
  } catch (error) {
    console.error('Failed to fetch memes:', error)
    return apiError('Failed to fetch memes', 500)
  }
}