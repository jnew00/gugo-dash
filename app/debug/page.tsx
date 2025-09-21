'use client'

import { useState, useEffect } from 'react'
import GugoButton from '@/components/GugoButton'

export default function DebugPage() {
  const [authResult, setAuthResult] = useState(null)
  const [mediaResult, setMediaResult] = useState(null)
  const [oauth1Result, setOauth1Result] = useState(null)
  const [memes, setMemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [oauth1Loading, setOauth1Loading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/twitter/test-auth')
      const data = await response.json()
      setAuthResult(data)
    } catch (error) {
      setAuthResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const loadMemes = async () => {
    try {
      const response = await fetch('/api/memes')
      const data = await response.json()
      setMemes(data || [])
    } catch (error) {
      console.error('Failed to load memes:', error)
    }
  }

  const testMediaUpload = async (memeId) => {
    setMediaLoading(true)
    try {
      const response = await fetch('/api/twitter/test-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memeId })
      })
      const data = await response.json()
      setMediaResult(data)
    } catch (error) {
      setMediaResult({ error: error.message })
    } finally {
      setMediaLoading(false)
    }
  }

  const testOAuth1 = async () => {
    setOauth1Loading(true)
    try {
      const response = await fetch('/api/twitter/verify-oauth1')
      const data = await response.json()
      setOauth1Result(data)
    } catch (error) {
      setOauth1Result({ error: error.message })
    } finally {
      setOauth1Loading(false)
    }
  }

  // Load memes on component mount
  useEffect(() => {
    loadMemes()
  }, [])

  return (
    <div className="gugo-container">
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-gugo-header text-4xl font-bold mb-8 text-gugo-dark">
            Twitter Authentication Debug
          </h1>

          <div className="gugo-card">
            <div className="mb-6 space-y-3">
              <GugoButton onClick={testAuth} disabled={loading}>
                {loading ? 'Testing...' : 'Test OAuth 2.0 Authentication'}
              </GugoButton>

              <GugoButton onClick={testOAuth1} disabled={oauth1Loading} variant="secondary">
                {oauth1Loading ? 'Testing...' : 'Test OAuth 1.0a Credentials'}
              </GugoButton>
            </div>

            {authResult && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">OAuth 2.0 Result:</h2>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 border">
                  {JSON.stringify(authResult, null, 2)}
                </pre>
              </div>
            )}

            {oauth1Result && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">OAuth 1.0a Result:</h2>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 border">
                  {JSON.stringify(oauth1Result, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="gugo-card mt-8">
            <h2 className="text-xl font-bold mb-4">Media Upload Test:</h2>
            <div className="space-y-4">
              <p>Test uploading memes to Twitter's media API:</p>

              {memes.length > 0 ? (
                <div className="space-y-3">
                  {memes.map((meme) => (
                    <div key={meme.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-bold">{meme.filename}</span>
                        {meme.tags && <span className="text-sm text-gray-600 ml-2">({meme.tags})</span>}
                      </div>
                      <GugoButton
                        onClick={() => testMediaUpload(meme.id)}
                        disabled={mediaLoading}
                        className="text-xs py-1 px-3"
                      >
                        {mediaLoading ? 'Testing...' : 'Test Upload'}
                      </GugoButton>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No memes found. Upload some in the Admin page first.</p>
              )}

              {mediaResult && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Media Upload Result:</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 border">
                    {JSON.stringify(mediaResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="gugo-card mt-8">
            <h2 className="text-xl font-bold mb-4">Required Steps:</h2>
            <ol className="list-decimal list-inside space-y-2 text-base">
              <li>Make sure your Twitter app has OAuth 2.0 enabled</li>
              <li>Verify your app has the following scopes: <code className="bg-gray-100 px-2 py-1 rounded">tweet.read tweet.write users.read offline.access</code></li>
              <li>Sign out and sign back in to get new permissions</li>
              <li>Test the authentication using the button above</li>
              <li>If user API works but posting fails, check rate limits and app permissions</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}