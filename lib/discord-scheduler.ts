import cron from 'node-cron'
import { getDiscordBot } from './discord-bot'

export class DiscordScheduler {
  private static instance: DiscordScheduler | null = null
  private cronJob: cron.ScheduledTask | null = null
  private isRunning = false

  static getInstance(): DiscordScheduler {
    if (!DiscordScheduler.instance) {
      DiscordScheduler.instance = new DiscordScheduler()
    }
    return DiscordScheduler.instance
  }

  start() {
    if (this.isRunning) {
      console.log('Discord scheduler is already running')
      return
    }

    const intervalMinutes = parseInt(process.env.CHECK_INTERVAL_MINUTES || '5')
    const cronExpression = `*/${intervalMinutes} * * * *`

    this.cronJob = cron.schedule(cronExpression, async () => {
      console.log('Running scheduled Discord check...')
      try {
        const bot = getDiscordBot()
        if (bot.getStatus().isReady) {
          const result = await bot.checkChannelsManually()
          console.log(`Scheduled check completed: ${result.totalMessages} messages scanned, ${result.totalTweets} tweets found`)
        } else {
          console.log('Discord bot not ready, skipping scheduled check')
        }
      } catch (error) {
        console.error('Scheduled Discord check failed:', error)
      }
    }, {
      scheduled: false
    })

    this.cronJob.start()
    this.isRunning = true
    
    console.log(`Discord scheduler started with ${intervalMinutes}-minute intervals`)
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop()
      this.cronJob = null
    }
    this.isRunning = false
    console.log('Discord scheduler stopped')
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || '5')
    }
  }
}