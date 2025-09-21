import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET() {
  try {
    const hashtags = await prisma.hashtag.findMany({
      orderBy: { tag: 'asc' }
    })
    return apiResponse(hashtags)
  } catch (error) {
    console.error('Failed to fetch hashtags:', error)
    return apiError('Failed to fetch hashtags', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tag } = await request.json()

    if (!tag) {
      return apiError('Tag is required', 400)
    }

    // Clean the tag (remove # if present, trim)
    const cleanTag = tag.replace(/^#/, '').trim()

    if (!cleanTag) {
      return apiError('Invalid tag', 400)
    }

    const hashtag = await prisma.hashtag.create({
      data: {
        tag: cleanTag,
        active: true
      }
    })

    return apiResponse(hashtag)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return apiError('Hashtag already exists', 409)
    }
    console.error('Failed to create hashtag:', error)
    return apiError('Failed to create hashtag', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('ID is required', 400)
    }

    await prisma.hashtag.delete({
      where: { id }
    })

    return apiResponse({ message: 'Hashtag deleted successfully' })
  } catch (error) {
    console.error('Failed to delete hashtag:', error)
    return apiError('Failed to delete hashtag', 500)
  }
}