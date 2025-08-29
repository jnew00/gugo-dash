import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET() {
  try {
    const images = await prisma.baseImage.findMany({
      orderBy: { uploadedAt: 'desc' }
    })
    
    return apiResponse({ images })
  } catch (error) {
    console.error('Failed to fetch images:', error)
    return apiError('Failed to fetch images', 500)
  }
}