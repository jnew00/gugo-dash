export function apiResponse(data: any, status = 200) {
  return Response.json(data, { status })
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

export function extractTweetId(url: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /mobile\.twitter\.com\/\w+\/status\/(\d+)/,
    /mobile\.x\.com\/\w+\/status\/(\d+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

export function extractAuthorFromUrl(url: string): string | null {
  const patterns = [
    /twitter\.com\/(\w+)\/status\/\d+/,
    /x\.com\/(\w+)\/status\/\d+/,
    /mobile\.twitter\.com\/(\w+)\/status\/\d+/,
    /mobile\.x\.com\/(\w+)\/status\/\d+/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

export function isValidTwitterUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?(twitter|x)\.com\/\w+\/status\/\d+/,
    /^https?:\/\/mobile\.(twitter|x)\.com\/\w+\/status\/\d+/
  ]
  
  return patterns.some(pattern => pattern.test(url))
}