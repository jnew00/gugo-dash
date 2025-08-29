import { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { apiError } from '@/lib/utils'

interface RouteParams {
  params: {
    path: string[]
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const filePath = params.path.join('/')
    const uploadDir = process.env.UPLOAD_DIR || './storage'
    const fullPath = join(uploadDir, filePath)
    
    // Security check: ensure the path is within the upload directory
    const resolvedPath = join(uploadDir, filePath)
    if (!resolvedPath.startsWith(uploadDir)) {
      return apiError('Invalid file path', 403)
    }
    
    try {
      const fileBuffer = await readFile(fullPath)
      
      // Determine content type based on file extension
      const extension = filePath.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
      
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg'
          break
        case 'png':
          contentType = 'image/png'
          break
        case 'gif':
          contentType = 'image/gif'
          break
        case 'webp':
          contentType = 'image/webp'
          break
      }
      
      return new Response(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch (fileError) {
      return apiError('File not found', 404)
    }
  } catch (error) {
    console.error('Failed to serve file:', error)
    return apiError('Failed to serve file', 500)
  }
}