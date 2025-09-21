import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/utils'

export async function GET() {
  try {
    const settings = await prisma.adminSettings.findUnique({
      where: { id: 'admin' }
    })

    if (!settings) {
      // Create default settings if they don't exist
      const defaultSettings = await prisma.adminSettings.create({
        data: {
          id: 'admin',
          textProvider: 'local',
          imageProvider: 'together',
          memeMatchModel: 'local'
        }
      })
      return apiResponse(defaultSettings)
    }

    return apiResponse(settings)
  } catch (error) {
    console.error('Failed to fetch admin settings:', error)
    return apiError('Failed to fetch admin settings', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { textProvider, imageProvider, memeMatchModel } = await request.json()

    const settings = await prisma.adminSettings.upsert({
      where: { id: 'admin' },
      update: {
        textProvider,
        imageProvider,
        memeMatchModel,
        updatedAt: new Date()
      },
      create: {
        id: 'admin',
        textProvider,
        imageProvider,
        memeMatchModel
      }
    })

    return apiResponse(settings)
  } catch (error) {
    console.error('Failed to update admin settings:', error)
    return apiError('Failed to update admin settings', 500)
  }
}