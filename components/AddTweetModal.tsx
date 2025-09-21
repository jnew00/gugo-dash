'use client'

import { useState } from 'react'
import GugoButton from './GugoButton'

interface AddTweetModalProps {
  onClose: () => void
  onAdd: (url: string, content?: string) => void
}

export default function AddTweetModal({ onClose, onAdd }: AddTweetModalProps) {
  const [tweetUrl, setTweetUrl] = useState('')
  const [tweetContent, setTweetContent] = useState('')
  const [showContentField, setShowContentField] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async () => {
    if (!tweetUrl.trim()) return

    setIsAdding(true)
    try {
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: tweetUrl.trim(),
          tweetText: showContentField && tweetContent ? tweetContent.trim() : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        onAdd(tweetUrl, tweetContent)

        // If content wasn't fetched automatically, show edit modal
        if (data.tweet && data.tweet.tweetText.includes('[Tweet content not available')) {
          alert('Tweet added! Click the Edit button to add the actual tweet content.')
        }
      }
    } catch (error) {
      console.error('Failed to add tweet:', error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="gugo-modal-overlay" onClick={onClose}>
      <div className="gugo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gugo-modal-header">
          <div className="flex items-center justify-between">
            <h2 className="gugo-modal-title">ADD TWEET</h2>
            <button
              onClick={onClose}
              className="text-2xl font-black hover:text-gugo-gold transition-colors duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="font-black uppercase text-sm tracking-wide">
              TWEET URL
            </label>
            <input
              type="url"
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              placeholder="https://x.com/username/status/..."
              className="gugo-input w-full mt-1"
              autoFocus
            />
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <p className="text-xs text-orange-800">
              <strong>Note:</strong> Due to Twitter/X API rate limits, you may need to manually paste the tweet content.
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showContentField}
                onChange={(e) => setShowContentField(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-bold">I want to paste the tweet content now</span>
            </label>
          </div>

          {showContentField && (
            <div>
              <label className="font-black uppercase text-sm tracking-wide">
                TWEET CONTENT
              </label>
              <textarea
                value={tweetContent}
                onChange={(e) => setTweetContent(e.target.value)}
                placeholder="Paste the tweet content here..."
                className="gugo-textarea w-full h-32 mt-1"
              />
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <GugoButton variant="secondary" onClick={onClose}>
              CANCEL
            </GugoButton>
            <GugoButton
              onClick={handleSubmit}
              disabled={isAdding || !tweetUrl.trim()}
            >
              {isAdding ? 'ADDING...' : 'ADD TWEET'}
            </GugoButton>
          </div>
        </div>
      </div>
    </div>
  )
}