import { apiResponse } from '@/lib/utils'
import { getDiscordBot } from '@/lib/discord-bot'

export async function GET() {
  try {
    const bot = getDiscordBot()
    const status = bot.getStatus()
    
    return apiResponse({
      status,
      message: status.isReady ? 'Discord bot is running' : 'Discord bot is not ready'
    })
  } catch (error) {
    console.error('Failed to get Discord bot status:', error)
    return apiResponse({
      status: { isReady: false },
      message: 'Discord bot is not running'
    })
  }
}