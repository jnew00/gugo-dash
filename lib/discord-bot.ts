import { PrismaClient } from '@prisma/client'
import { extractTweetId, extractAuthorFromUrl, isValidTwitterUrl } from './utils'

let Client: any = null
let GatewayIntentBits: any = null
let Events: any = null

try {
  const discordImport = require('discord.js')
  Client = discordImport.Client
  GatewayIntentBits = discordImport.GatewayIntentBits
  Events = discordImport.Events
} catch (error) {
  console.warn('Discord.js not available:', error instanceof Error ? error.message : String(error))
}

const prisma = new PrismaClient()

export class DiscordBot {
  private client: any
  private channelIds: string[] = []
  private isReady = false

  constructor() {
    this.channelIds = process.env.DISCORD_CHANNEL_IDS?.split(',') || []
    
    if (!Client || !GatewayIntentBits || !Events) {
      console.warn('Discord.js not available - Discord bot will not function')
      return
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    })
    
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.client.once(Events.ClientReady, (readyClient: any) => {
      console.log(`Discord bot ready! Logged in as ${readyClient.user.tag}`)
      this.isReady = true
    })

    this.client.on(Events.MessageCreate, (message: any) => {
      if (message.author.bot) return
      if (!this.channelIds.includes(message.channelId)) return

      this.processMessage(message.content)
    })

    this.client.on(Events.Error, (error: any) => {
      console.error('Discord bot error:', error)
    })
  }

  private async processMessage(content: string) {
    const urls = this.extractUrls(content)
    const twitterUrls = urls.filter(url => isValidTwitterUrl(url))

    for (const url of twitterUrls) {
      await this.addTweetFromUrl(url)
    }
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
    return text.match(urlRegex) || []
  }

  private async addTweetFromUrl(url: string) {
    try {
      const tweetId = extractTweetId(url)
      const author = extractAuthorFromUrl(url)

      if (!tweetId || !author) {
        console.log(`Could not extract tweet info from URL: ${url}`)
        return
      }

      // Check if tweet already exists
      const existingTweet = await prisma.tweet.findUnique({
        where: { tweetUrl: url }
      })

      if (existingTweet) {
        console.log(`Tweet already exists: ${url}`)
        return
      }

      // For now, use placeholder text since we don't have Twitter API
      const tweetText = `Discord-sourced tweet from ${author} - This will be replaced with actual tweet content when Twitter API is configured.`

      await prisma.tweet.create({
        data: {
          tweetUrl: url,
          tweetId,
          author,
          tweetText,
          source: 'DISCORD',
          status: 'NEW'
        }
      })

      console.log(`Added new tweet from Discord: ${url}`)
    } catch (error) {
      console.error(`Failed to add tweet from Discord: ${url}`, error)
    }
  }

  async start() {
    if (!this.client) {
      throw new Error('Discord.js not available - cannot start bot')
    }

    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN environment variable is required')
    }

    if (!this.channelIds.length) {
      console.warn('No Discord channel IDs configured. Bot will not monitor any channels.')
    }

    try {
      await this.client.login(token)
    } catch (error) {
      console.error('Failed to start Discord bot:', error)
      throw error
    }
  }

  async stop() {
    if (this.client) {
      this.client.destroy()
    }
    await prisma.$disconnect()
    this.isReady = false
  }

  getStatus() {
    return {
      isReady: this.isReady,
      channelIds: this.channelIds,
      guilds: this.client?.guilds?.cache?.size || 0,
      uptime: this.client?.uptime || 0
    }
  }

  async checkChannelsManually() {
    if (!this.client || !this.isReady) {
      throw new Error('Discord bot is not ready')
    }

    let totalMessages = 0
    let totalTweets = 0

    for (const channelId of this.channelIds) {
      try {
        const channel = await this.client.channels.fetch(channelId)
        if (!channel || !('messages' in channel)) {
          console.log(`Channel ${channelId} not found or is not a text channel`)
          continue
        }

        const messages = await channel.messages.fetch({ limit: 50 })
        totalMessages += messages.size

        for (const message of messages.values()) {
          const urls = this.extractUrls(message.content)
          const twitterUrls = urls.filter(url => isValidTwitterUrl(url))
          
          for (const url of twitterUrls) {
            await this.addTweetFromUrl(url)
            totalTweets++
          }
        }
      } catch (error) {
        console.error(`Failed to check channel ${channelId}:`, error)
      }
    }

    return { totalMessages, totalTweets }
  }
}

// Singleton instance
let botInstance: DiscordBot | null = null

export function getDiscordBot(): DiscordBot {
  if (!botInstance) {
    botInstance = new DiscordBot()
  }
  return botInstance
}