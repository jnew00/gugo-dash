import { DeepSeekProvider } from './deepseek'
import { OpenAIProvider } from './openai'
import { LocalLLMProvider } from './local'

export type TextProvider = 'deepseek' | 'openai' | 'local'

export interface AIProvider {
  generateReply(tweetText: string, tweetAuthor: string): Promise<string[] | { suggestions: string[], isActualAI: boolean, statusMessage: string }>
}

export function getTextProvider(provider?: TextProvider): AIProvider {
  const selectedProvider = provider || (process.env.TEXT_PROVIDER as TextProvider) || 'deepseek'

  switch (selectedProvider) {
    case 'deepseek':
      return new DeepSeekProvider()
    case 'openai':
      return new OpenAIProvider()
    case 'local':
      return new LocalLLMProvider()
    default:
      throw new Error(`Unknown text provider: ${selectedProvider}`)
  }
}

// Get available providers based on environment configuration
export function getAvailableProviders(): { text: string[], image: string[], vision: string[] } {
  const providers = {
    text: [] as string[],
    image: [] as string[],
    vision: [] as string[]
  }

  // Check for text providers
  if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your-deepseek-api-key-here') {
    providers.text.push('deepseek')
    providers.vision.push('deepseek')
  }
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    providers.text.push('openai')
    providers.vision.push('openai')
  }
  if (process.env.LOCAL_LLM_BASE || process.env.LOCAL_TEXT_MODEL) {
    providers.text.push('local')
  }
  if (process.env.LOCAL_VISION_MODEL) {
    providers.vision.push('local')
  }

  // Check for image providers
  if (process.env.TOGETHER_API_KEY && process.env.TOGETHER_API_KEY !== 'your-together-api-key-here') {
    providers.image.push('together')
  }
  if (process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN !== 'your-replicate-api-token-here') {
    providers.image.push('replicate')
  }

  return providers
}