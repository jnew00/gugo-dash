// Twitter API v2 media upload using OAuth 2.0 Bearer tokens
interface UploadedMedia {
  mediaId: string
  mediaKey?: string
}

export async function uploadMediaWithOAuth2(
  mediaBuffer: Buffer,
  filename: string,
  bearerToken: string
): Promise<UploadedMedia | null> {
  try {
    console.log(`Starting Twitter API v2 media upload for ${filename}, size: ${mediaBuffer.length} bytes`)

    // Try the new v2 media upload endpoint with OAuth 2.0
    const mediaType = filename.endsWith('.gif') ? 'image/gif' :
                     filename.endsWith('.png') ? 'image/png' : 'image/jpeg'

    // Create FormData for multipart upload
    const formData = new FormData()
    const mediaBlob = new Blob([mediaBuffer], { type: mediaType })
    formData.append('media', mediaBlob, filename)
    formData.append('media_category', 'tweet_image')

    console.log('Attempting Twitter API v2 media upload with OAuth 2.0...')

    // Use the correct X API v2 endpoint
    const response = await fetch('https://api.x.com/2/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formData
    })

    console.log('v2 Media upload response status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('v2 Media uploaded successfully:', data)

      const mediaKey = data?.data?.media_key || data?.media_key
      const mediaId = data?.data?.id || data?.media_id_string || data?.media_id

      if (!mediaId) {
        console.error('v2 Media upload missing media id in response payload')
        return null
      }

      return {
        mediaId,
        mediaKey
      }
    }

    const errorText = await response.text()
    console.error('v2 Media upload failed:', response.status, errorText)
    return null

  } catch (error) {
    console.error('v2 Media upload exception:', error)
    return null
  }
}
