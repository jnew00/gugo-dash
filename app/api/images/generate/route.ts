import { NextRequest } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'
import { getImageProvider } from '@/lib/ai-providers/images'

export async function POST(request: NextRequest) {
  try {
    const { baseImageId, prompt } = await request.json()
    
    if (!prompt) {
      return apiError('Prompt is required')
    }
    
    let baseImage = null
    if (baseImageId) {
      baseImage = await prisma.baseImage.findUnique({
        where: { id: baseImageId }
      })
      
      if (!baseImage) {
        return apiError('Base image not found', 404)
      }
    }
    
    // Generate composite image
    const provider = getImageProvider()
    const base64Image = await provider.generateComposite(prompt, baseImage?.path)
    
    // Save generated image
    const timestamp = Date.now()
    const filename = `generated_${timestamp}_${Math.random().toString(36).substring(7)}.png`
    
    const uploadDir = process.env.UPLOAD_DIR || './storage'
    const generatedImagesDir = join(uploadDir, 'generated_images')
    
    // Ensure directory exists
    await writeFile(join(generatedImagesDir, '.gitkeep'), '')
      .catch(() => {}) // Directory might already exist
    
    const filePath = join(generatedImagesDir, filename)
    const publicPath = `/storage/generated_images/${filename}`
    
    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(base64Image, 'base64')
    await writeFile(filePath, imageBuffer)
    
    return apiResponse({ 
      imagePath: publicPath,
      filename,
      baseImageId: baseImageId || null
    })
  } catch (error) {
    console.error('Failed to generate composite image:', error)
    return apiError('Failed to generate composite image', 500)
  }
}