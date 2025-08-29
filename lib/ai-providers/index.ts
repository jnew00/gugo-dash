import { DeepSeekProvider } from './deepseek'
import { OpenAIProvider } from './openai'

export type TextProvider = 'deepseek' | 'openai'

export interface AIProvider {
  generateReply(tweetText: string, tweetAuthor: string): Promise<string[]>
}

export function getTextProvider(provider?: TextProvider): AIProvider {
  const selectedProvider = provider || (process.env.TEXT_PROVIDER as TextProvider) || 'deepseek'
  
  switch (selectedProvider) {
    case 'deepseek':
      return new DeepSeekProvider()
    case 'openai':
      return new OpenAIProvider()
    default:
      throw new Error(`Unknown text provider: ${selectedProvider}`)
  }
}