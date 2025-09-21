import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls)) {
      return apiError('URLs array is required', 400)
    }

    // Ensure memes directory exists
    const memesDir = join(process.cwd(), 'storage', 'memes')
    if (!existsSync(memesDir)) {
      await mkdir(memesDir, { recursive: true })
    }

    const importedMemes = []
    const errors = []

    for (const url of urls) {
      try {
        // Fetch the image
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        })

        if (!response.ok) {
          errors.push(`Failed to fetch ${url}: ${response.statusText}`)
          continue
        }

        // Get file extension from URL or content type
        let extension = 'jpg'
        const urlExt = url.split('.').pop()?.toLowerCase()
        if (urlExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExt)) {
          extension = urlExt
        } else {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('png')) extension = 'png'
          else if (contentType?.includes('gif')) extension = 'gif'
          else if (contentType?.includes('webp')) extension = 'webp'
        }

        // Generate unique filename
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 15)
        const filename = `gugo-${timestamp}-${randomId}.${extension}`

        const filepath = join(memesDir, filename)
        const relativePath = join('storage', 'memes', filename)

        // Save file
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await writeFile(filepath, buffer)

        // Extract potential tags from URL or filename
        const tags = ['gugo', 'official']
        if (url.includes('meme')) tags.push('meme')
        if (url.includes('run')) tags.push('running', 'fitness')

        // Save to database
        const meme = await prisma.meme.create({
          data: {
            filename,
            path: relativePath,
            description: `GUGO meme imported from ${url}`,
            tags
          }
        })

        importedMemes.push(meme)

      } catch (error) {
        console.error(`Error importing ${url}:`, error)
        errors.push(`Error importing ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return apiResponse({
      message: `Imported ${importedMemes.length} memes successfully`,
      imported: importedMemes,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Failed to import memes:', error)
    return apiError('Failed to import memes', 500)
  }
}