import Replicate from 'replicate'

export class ReplicateImageProvider {
  private client: Replicate

  constructor(apiKey?: string) {
    this.client = new Replicate({
      auth: apiKey || process.env.REPLICATE_API_KEY
    })
  }

  async generateComposite(prompt: string, baseImagePath?: string): Promise<string> {
    try {
      const input = {
        prompt: `${prompt}, high quality, detailed, professional, social media ready`,
        negative_prompt: 'blurry, low quality, distorted, watermark, text, signature, bad anatomy',
        width: 1024,
        height: 1024,
        num_outputs: 1,
        num_inference_steps: 30,
        guidance_scale: 7.5
      }

      const output = await this.client.run(
        'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        { input }
      ) as string[]

      if (!output || output.length === 0) {
        throw new Error('No image generated')
      }

      // Fetch the image and convert to base64
      const imageResponse = await fetch(output[0])
      const imageBuffer = await imageResponse.arrayBuffer()
      const base64 = Buffer.from(imageBuffer).toString('base64')

      return base64
    } catch (error) {
      console.error('Replicate API error:', error)
      throw new Error('Failed to generate composite image')
    }
  }
}