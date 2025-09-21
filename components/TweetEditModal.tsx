'use client'

import { useState } from 'react'
import { Tweet } from '@prisma/client'
import GugoButton from './GugoButton'

interface TweetEditModalProps {
  tweet: Tweet
  onClose: () => void
  onSave: (tweetId: string, tweetText: string, author: string) => void
}

export default function TweetEditModal({ tweet, onClose, onSave }: TweetEditModalProps) {
  const [tweetText, setTweetText] = useState(tweet.tweetText)
  const [author, setAuthor] = useState(tweet.author)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/tweets/${tweet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetText, author })
      })

      if (response.ok) {
        onSave(tweet.id, tweetText, author)
        onClose()
      }
    } catch (error) {
      console.error('Failed to update tweet:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="gugo-modal-overlay" onClick={onClose}>
      <div className="gugo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gugo-modal-header">
          <div className="flex items-center justify-between">
            <h2 className="gugo-modal-title">EDIT TWEET</h2>
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
            <div className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded text-sm">
              {tweet.tweetUrl}
            </div>
          </div>

          <div>
            <label className="font-black uppercase text-sm tracking-wide">
              AUTHOR
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="gugo-input w-full mt-1"
            />
          </div>

          <div>
            <label className="font-black uppercase text-sm tracking-wide">
              TWEET CONTENT
            </label>
            <textarea
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              placeholder="Paste the actual tweet content here..."
              className="gugo-textarea w-full h-32 mt-1"
            />
            {tweetText.includes('[Tweet content not available') && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Please paste the actual tweet content above
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <GugoButton variant="secondary" onClick={onClose}>
              CANCEL
            </GugoButton>
            <GugoButton
              onClick={handleSave}
              disabled={isSaving || !tweetText.trim()}
            >
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </GugoButton>
          </div>
        </div>
      </div>
    </div>
  )
}