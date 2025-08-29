import { NextRequest } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const description = formData.get('description') as string
    
    if (!file) {
      return apiError('No image file provided')
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return apiError('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return apiError('File too large. Maximum size is 10MB.')
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = process.env.UPLOAD_DIR || './storage'
    const baseImagesDir = join(uploadDir, 'base_images')
    
    // Ensure directory exists
    await writeFile(join(baseImagesDir, '.gitkeep'), '')
      .catch(() => {}) // Directory might already exist
    
    const filePath = join(baseImagesDir, filename)
    const publicPath = `/storage/base_images/${filename}`
    
    // Save file to disk
    await writeFile(filePath, buffer)
    
    // Save to database
    const image = await prisma.baseImage.create({
      data: {
        filename,
        path: publicPath,
        description: description || `Uploaded ${new Date().toLocaleDateString()}`
      }
    })
    
    return apiResponse({ image }, 201)
  } catch (error) {
    console.error('Failed to upload image:', error)
    return apiError('Failed to upload image', 500)
  }
}