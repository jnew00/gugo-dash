interface TogetherImageRequest {
  model: string
  prompt: string
  negative_prompt?: string
  width: number
  height: number
  steps: number
  n: number
  response_format?: 'b64_json' | 'url'
}

interface TogetherImageResponse {
  data: {
    b64_json?: string
    url?: string
  }[]
}

export class TogetherImageProvider {
  private apiKey: string
  private baseUrl = 'https://api.together.xyz/v1/images/generations'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TOGETHER_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('Together API key is required')
    }
  }

  async generateComposite(prompt: string, baseImagePath?: string): Promise<string> {
    const request: TogetherImageRequest = {
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      prompt: `${prompt}, high quality, detailed, professional, social media ready`,
      negative_prompt: 'blurry, low quality, distorted, watermark, text, signature, bad anatomy',
      width: 1024,
      height: 1024,
      steps: 30,
      n: 1,
      response_format: 'b64_json'
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Together API error: ${response.statusText}`)
      }

      const data: TogetherImageResponse = await response.json()
      const imageData = data.data[0]?.b64_json

      if (!imageData) {
        throw new Error('No image data received from Together API')
      }

      return imageData
    } catch (error) {
      console.error('Together API error:', error)
      throw new Error('Failed to generate composite image')
    }
  }
}