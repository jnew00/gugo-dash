'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import GugoButton from './GugoButton'

interface Meme {
  id: string
  filename: string
  path: string
  tags: string[]
  description?: string
  uploadedAt: string
}

interface MemeSelectorProps {
  selectedMeme: string | null
  onMemeSelect: (memeId: string | null) => void
  tweetText?: string
  tweetAuthor?: string
}

export default function MemeSelector({ selectedMeme, onMemeSelect, tweetText, tweetAuthor }: MemeSelectorProps) {
  const [memes, setMemes] = useState<Meme[]>([])
  const [matchedMemes, setMatchedMemes] = useState<Meme[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMatching, setIsMatching] = useState(false)
  const [showAllMemes, setShowAllMemes] = useState(false)
  const [matchProvider, setMatchProvider] = useState<string>('')
  const [matchStatus, setMatchStatus] = useState<string>('')

  useEffect(() => {
    fetchMemes()
  }, [])

  const fetchMemes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/memes')
      const data = await response.json()
      setMemes(data || [])
    } catch (error) {
      console.error('Failed to fetch memes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const matchMemes = async () => {
    if (!tweetText || !tweetAuthor) return

    setIsMatching(true)
    setMatchStatus('Analyzing tweet...')

    try {
      const response = await fetch('/api/memes/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetText, tweetAuthor })
      })
      const data = await response.json()

      // Update provider info
      setMatchProvider(data.providerName || 'Unknown')
      setMatchStatus(`Matched by ${data.providerName || 'AI'}`)

      setMatchedMemes(data.matches || [])
      setShowAllMemes(false) // Show AI recommendations first
    } catch (error) {
      console.error('Failed to match memes:', error)
      setMatchStatus('Matching failed')
    } finally {
      setIsMatching(false)

      // Clear status after a delay
      setTimeout(() => {
        setMatchStatus('')
      }, 3000)
    }
  }

  useEffect(() => {
    if (tweetText && tweetAuthor) {
      matchMemes()
    }
  }, [tweetText, tweetAuthor])

  const displayMemes = showAllMemes ? memes : (matchedMemes.length > 0 ? matchedMemes : memes)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-black uppercase text-sm tracking-wide">SELECT MEME</h4>
          {matchStatus && (
            <p className="text-xs text-gugo-brown mt-1">
              {matchStatus}
            </p>
          )}
        </div>
        <div className="space-x-2">
          {tweetText && tweetAuthor && (
            <GugoButton
              variant="secondary"
              onClick={matchMemes}
              disabled={isMatching}
              className="text-xs py-2 px-4"
            >
              {isMatching ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin w-3 h-3 border border-gugo-black border-t-transparent rounded-full"></div>
                  <span>MATCHING...</span>
                </span>
              ) : (
                'AI MATCH'
              )}
            </GugoButton>
          )}
          <GugoButton
            variant="secondary"
            onClick={fetchMemes}
            disabled={isLoading}
            className="text-xs py-2 px-4"
          >
            REFRESH
          </GugoButton>
        </div>
      </div>

      {matchedMemes.length > 0 && !showAllMemes && (
        <div className="p-3 bg-gugo-green border-2 border-gugo-black">
          <div className="flex items-center justify-between">
            <p className="font-black text-gugo-black text-xs uppercase">
              AI FOUND {matchedMemes.length} RELEVANT MEME{matchedMemes.length > 1 ? 'S' : ''}
            </p>
            <button
              onClick={() => setShowAllMemes(true)}
              className="text-xs underline text-gugo-black"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {showAllMemes && matchedMemes.length > 0 && (
        <div className="p-2 bg-gray-100 border border-gray-300">
          <button
            onClick={() => setShowAllMemes(false)}
            className="text-xs underline text-gray-600"
          >
            ← Back to AI recommendations
          </button>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">⚡</div>
            <p className="font-black uppercase">LOADING MEMES...</p>
          </div>
        ) : displayMemes.length === 0 ? (
          <div className="text-center py-8 border-2 border-gray-300 border-dashed">
            <p className="text-sm text-gray-600">No memes available</p>
            <p className="text-xs text-gray-500 mt-2">Upload some memes in the admin panel</p>
          </div>
        ) : (
          <div className="gugo-grid gugo-grid-4 gap-3">
            {displayMemes.map((meme) => (
              <div
                key={meme.id}
                className={`cursor-pointer border-3 transition-all duration-200 ${
                  selectedMeme === meme.id
                    ? 'border-gugo-green shadow-brutal ring-4 ring-gugo-green ring-opacity-30'
                    : 'border-gugo-black hover:border-gugo-green hover:shadow-adventure'
                }`}
                onClick={() => onMemeSelect(selectedMeme === meme.id ? null : meme.id)}
              >
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={`/api/memes/serve/${meme.filename}`}
                    alt={meme.description || meme.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {selectedMeme === meme.id && (
                    <div className="absolute inset-0 bg-gugo-green bg-opacity-40 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-12 h-12 bg-gugo-green border-3 border-gugo-black rounded-full flex items-center justify-center shadow-brutal animate-pulse">
                        <span className="text-gugo-black text-2xl font-black">✓</span>
                      </div>
                      <div className="absolute top-2 right-2 bg-gugo-green border-2 border-gugo-black rounded px-2 py-1">
                        <span className="text-xs font-black text-gugo-black">SELECTED</span>
                      </div>
                    </div>
                  )}
                </div>
                {(meme.description || meme.tags.length > 0) && (
                  <div className="p-2 bg-white">
                    {meme.description ? (
                      <div className="text-xs text-gray-700 leading-tight">
                        {meme.description}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 truncate">
                        Tags: {meme.tags.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMeme && (
        <div className="p-3 bg-gugo-green border-3 border-gugo-black">
          <p className="font-black text-gugo-black text-xs uppercase">
            MEME SELECTED - READY TO POST
          </p>
        </div>
      )}
    </div>
  )
}