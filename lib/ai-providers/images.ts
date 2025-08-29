import { TogetherImageProvider } from './together'
import { ReplicateImageProvider } from './replicate'

export type ImageProvider = 'together' | 'replicate' | 'comfyui' | 'openai'

export interface AIImageProvider {
  generateComposite(prompt: string, baseImagePath?: string): Promise<string>
}

export function getImageProvider(provider?: ImageProvider): AIImageProvider {
  const selectedProvider = provider || (process.env.IMAGE_PROVIDER as ImageProvider) || 'together'
  
  switch (selectedProvider) {
    case 'together':
      return new TogetherImageProvider()
    case 'replicate':
      return new ReplicateImageProvider()
    case 'comfyui':
      throw new Error('ComfyUI provider not implemented yet')
    case 'openai':
      throw new Error('OpenAI image provider not implemented yet')
    default:
      throw new Error(`Unknown image provider: ${selectedProvider}`)
  }
}