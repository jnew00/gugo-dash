import { NextRequest } from 'next/server'
import { apiResponse } from '@/lib/utils'
import { getAvailableProviders } from '@/lib/ai-providers'

export async function GET(request: NextRequest) {
  const providers = getAvailableProviders()

  // Add local option if any local model is configured
  if (!providers.text.includes('local') && (process.env.LOCAL_LLM_BASE || process.env.LOCAL_TEXT_MODEL)) {
    providers.text.push('local')
  }

  if (!providers.vision.includes('local') && process.env.LOCAL_VISION_MODEL) {
    providers.vision.push('local')
  }

  // Always include keyword and random for meme matching
  providers.vision.push('keyword', 'random')

  return apiResponse({
    providers,
    models: {
      localText: process.env.LOCAL_TEXT_MODEL || process.env.LOCAL_LLM_MODEL || 'Not configured',
      localVision: process.env.LOCAL_VISION_MODEL || 'Not configured',
      localBase: process.env.LOCAL_LLM_BASE || 'http://127.0.0.1:1234'
    }
  })
}