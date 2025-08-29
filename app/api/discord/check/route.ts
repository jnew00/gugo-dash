import { NextRequest } from 'next/server'
import { apiResponse, apiError } from '@/lib/utils'
import { getDiscordBot } from '@/lib/discord-bot'

export async function POST() {
  try {
    const bot = getDiscordBot()
    
    if (!bot.getStatus().isReady) {
      return apiError('Discord bot is not ready', 503)
    }

    const result = await bot.checkChannelsManually()
    
    return apiResponse({
      message: 'Discord channels checked successfully',
      ...result
    })
  } catch (error) {
    console.error('Failed to check Discord channels:', error)
    return apiError('Failed to check Discord channels', 500)
  }
}