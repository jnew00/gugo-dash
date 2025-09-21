import { apiResponse } from '@/lib/utils'

export async function GET() {
  return apiResponse({
    baseUrl: process.env.LOCAL_LLM_BASE || 'http://127.0.0.1:1234',
    textModel: process.env.LOCAL_TEXT_MODEL || process.env.LOCAL_LLM_MODEL || 'openai/gpt-oss-20b',
    visionModel: process.env.LOCAL_VISION_MODEL || process.env.LOCAL_LLM_MODEL || 'moondream-2b-2025-04-14',
    // Legacy field for backward compatibility
    model: process.env.LOCAL_LLM_MODEL || 'openai/gpt-oss-20b'
  })
}