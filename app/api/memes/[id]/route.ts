import { NextRequest } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tags, description, analyzed } = await request.json()

    const meme = await prisma.meme.update({
      where: { id: params.id },
      data: {
        ...(tags !== undefined && { tags }),
        ...(description !== undefined && { description }),
        ...(analyzed !== undefined && { analyzed })
      }
    })

    return apiResponse(meme)
  } catch (error) {
    console.error('Failed to update meme:', error)
    return apiError('Failed to update meme', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meme = await prisma.meme.findUnique({
      where: { id: params.id }
    })

    if (!meme) {
      return apiError('Meme not found', 404)
    }

    // Delete file from filesystem
    const filepath = join(process.cwd(), meme.path)
    if (existsSync(filepath)) {
      await unlink(filepath)
    }

    // Delete from database
    await prisma.meme.delete({
      where: { id: params.id }
    })

    return apiResponse({ message: 'Meme deleted successfully' })
  } catch (error) {
    console.error('Failed to delete meme:', error)
    return apiError('Failed to delete meme', 500)
  }
}