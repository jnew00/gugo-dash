import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET() {
  try {
    const mentions = await prisma.mention.findMany({
      orderBy: { handle: 'asc' }
    })
    return apiResponse(mentions)
  } catch (error) {
    console.error('Failed to fetch mentions:', error)
    return apiError('Failed to fetch mentions', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { handle } = await request.json()

    if (!handle) {
      return apiError('Handle is required', 400)
    }

    // Clean the handle (remove @ if present, trim)
    const cleanHandle = handle.replace(/^@/, '').trim()

    if (!cleanHandle) {
      return apiError('Invalid handle', 400)
    }

    const mention = await prisma.mention.create({
      data: {
        handle: cleanHandle,
        active: true
      }
    })

    return apiResponse(mention)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return apiError('Mention already exists', 409)
    }
    console.error('Failed to create mention:', error)
    return apiError('Failed to create mention', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('ID is required', 400)
    }

    await prisma.mention.delete({
      where: { id }
    })

    return apiResponse({ message: 'Mention deleted successfully' })
  } catch (error) {
    console.error('Failed to delete mention:', error)
    return apiError('Failed to delete mention', 500)
  }
}