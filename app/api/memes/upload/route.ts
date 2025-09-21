import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return apiError('No files provided', 400)
    }

    // Ensure memes directory exists
    const memesDir = join(process.cwd(), 'storage', 'memes')
    if (!existsSync(memesDir)) {
      await mkdir(memesDir, { recursive: true })
    }

    const uploadedMemes = []

    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/gif', 'image/png', 'image/jpeg', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        continue // Skip invalid files
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const extension = file.name.split('.').pop()
      const filename = `${timestamp}-${randomId}.${extension}`

      const filepath = join(memesDir, filename)
      const relativePath = join('storage', 'memes', filename)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Save to database
      const meme = await prisma.meme.create({
        data: {
          filename,
          path: relativePath,
          description: file.name,
          tags: []
        }
      })

      uploadedMemes.push(meme)
    }

    return apiResponse({
      message: `Uploaded ${uploadedMemes.length} memes successfully`,
      memes: uploadedMemes
    })

  } catch (error) {
    console.error('Failed to upload memes:', error)
    return apiError('Failed to upload memes', 500)
  }
}