import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getImageAnalysisProvider } from '@/lib/ai-providers/image-analysis'
import { apiResponse, apiError } from '@/lib/utils'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { memeId, analyzeAll = false } = await request.json()

    // Get admin settings for analysis model configuration
    const adminSettings = await prisma.adminSettings.findUnique({
      where: { id: 'admin' }
    })

    const analysisModel = adminSettings?.memeAnalysisModel || 'local'
    console.log(`Using analysis model: ${analysisModel}`)

    if (analyzeAll) {
      // Analyze all unanalyzed memes
      const unanalyzedMemes = await prisma.meme.findMany({
        where: { analyzed: false },
        orderBy: { uploadedAt: 'desc' }
      })

      if (unanalyzedMemes.length === 0) {
        return apiResponse({
          message: 'No unanalyzed memes found',
          analyzed: 0
        })
      }

      console.log(`Starting batch analysis of ${unanalyzedMemes.length} memes`)
      const provider = getImageAnalysisProvider(analysisModel)
      const results = []

      for (const meme of unanalyzedMemes) {
        try {
          const imagePath = path.join(process.cwd(), 'storage', 'memes', meme.filename)

          if (!fs.existsSync(imagePath)) {
            console.error(`Image file not found: ${imagePath}`)
            continue
          }

          console.log(`Analyzing meme: ${meme.filename}`)
          const analysis = await provider.analyzeMeme(imagePath, meme.filename)

          // Update the meme with analysis results
          await prisma.meme.update({
            where: { id: meme.id },
            data: {
              description: analysis.description,
              tags: analysis.tags,
              analyzed: true
            }
          })

          results.push({
            id: meme.id,
            filename: meme.filename,
            description: analysis.description,
            tags: analysis.tags,
            statusMessage: analysis.statusMessage
          })

          console.log(`✓ Analyzed: ${meme.filename} - ${analysis.statusMessage}`)

        } catch (error) {
          console.error(`Failed to analyze meme ${meme.filename}:`, error)
          results.push({
            id: meme.id,
            filename: meme.filename,
            error: 'Analysis failed'
          })
        }
      }

      return apiResponse({
        message: `Batch analysis completed`,
        analyzed: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        results: results
      })

    } else if (memeId) {
      // Analyze single meme
      const meme = await prisma.meme.findUnique({
        where: { id: memeId }
      })

      if (!meme) {
        return apiError('Meme not found', 404)
      }

      const imagePath = path.join(process.cwd(), 'storage', 'memes', meme.filename)

      if (!fs.existsSync(imagePath)) {
        return apiError('Image file not found', 404)
      }

      console.log(`Analyzing single meme: ${meme.filename}`)
      const provider = getImageAnalysisProvider(analysisModel)
      const analysis = await provider.analyzeMeme(imagePath, meme.filename)

      // Update the meme with analysis results
      const updatedMeme = await prisma.meme.update({
        where: { id: memeId },
        data: {
          description: analysis.description,
          tags: analysis.tags,
          analyzed: true
        }
      })

      console.log(`✓ Analysis complete: ${analysis.statusMessage}`)
      console.log(`Description: ${analysis.description}`)
      console.log(`Tags: ${analysis.tags.join(', ')}`)

      return apiResponse({
        message: 'Meme analyzed successfully',
        meme: updatedMeme,
        analysis: {
          description: analysis.description,
          tags: analysis.tags,
          isActualAI: analysis.isActualAI,
          statusMessage: analysis.statusMessage
        }
      })

    } else {
      return apiError('Either memeId or analyzeAll must be provided', 400)
    }

  } catch (error) {
    console.error('Meme analysis error:', error)
    return apiError('Failed to analyze meme(s)', 500)
  }
}