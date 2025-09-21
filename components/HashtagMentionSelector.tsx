'use client'

import { useState, useEffect } from 'react'

interface Hashtag {
  id: string
  tag: string
  active: boolean
}

interface Mention {
  id: string
  handle: string
  active: boolean
}

interface HashtagMentionSelectorProps {
  replyText: string
  onUpdateReply: (text: string) => void
}

export default function HashtagMentionSelector({ replyText, onUpdateReply }: HashtagMentionSelectorProps) {
  const [hashtags, setHashtags] = useState<Hashtag[]>([])
  const [mentions, setMentions] = useState<Mention[]>([])
  const [showHashtags, setShowHashtags] = useState(false)
  const [showMentions, setShowMentions] = useState(false)

  useEffect(() => {
    fetchHashtags()
    fetchMentions()
  }, [])

  const fetchHashtags = async () => {
    try {
      const response = await fetch('/api/hashtags')
      if (response.ok) {
        const data = await response.json()
        setHashtags(data.filter((h: Hashtag) => h.active))
      }
    } catch (error) {
      console.error('Failed to fetch hashtags:', error)
    }
  }

  const fetchMentions = async () => {
    try {
      const response = await fetch('/api/mentions')
      if (response.ok) {
        const data = await response.json()
        setMentions(data.filter((m: Mention) => m.active))
      }
    } catch (error) {
      console.error('Failed to fetch mentions:', error)
    }
  }

  const addHashtag = (hashtag: Hashtag) => {
    const hashtagText = `#${hashtag.tag}`
    if (!replyText.includes(hashtagText)) {
      const newText = replyText.trim() + (replyText.trim() ? ' ' : '') + hashtagText
      onUpdateReply(newText)
    }
    setShowHashtags(false)
  }

  const addMention = (mention: Mention) => {
    const mentionText = `@${mention.handle}`
    if (!replyText.includes(mentionText)) {
      const newText = replyText.trim() + (replyText.trim() ? ' ' : '') + mentionText
      onUpdateReply(newText)
    }
    setShowMentions(false)
  }

  return (
    <div className="flex items-center space-x-2 mb-4">
      {/* Hashtags Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowHashtags(!showHashtags)
            setShowMentions(false)
          }}
          className="px-3 py-2 bg-gugo-green text-gugo-black border-2 border-gugo-black rounded hover:shadow-brutal transition-all text-sm font-bold"
          disabled={hashtags.length === 0}
        >
          # HASHTAGS ({hashtags.length})
        </button>

        {showHashtags && hashtags.length > 0 && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-white border-2 border-gugo-black shadow-brutal min-w-[200px] max-h-60 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-bold text-gugo-black mb-2 uppercase">Click to add:</div>
              {hashtags.map((hashtag) => (
                <button
                  key={hashtag.id}
                  onClick={() => addHashtag(hashtag)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gugo-green hover:text-gugo-black transition-colors border-b border-gray-200 last:border-0"
                >
                  #{hashtag.tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mentions Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowMentions(!showMentions)
            setShowHashtags(false)
          }}
          className="px-3 py-2 bg-gugo-green text-gugo-black border-2 border-gugo-black rounded hover:shadow-brutal transition-all text-sm font-bold"
          disabled={mentions.length === 0}
        >
          @ MENTIONS ({mentions.length})
        </button>

        {showMentions && mentions.length > 0 && (
          <div className="absolute top-full mt-2 left-0 z-50 bg-white border-2 border-gugo-black shadow-brutal min-w-[200px] max-h-60 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-bold text-gugo-black mb-2 uppercase">Click to add:</div>
              {mentions.map((mention) => (
                <button
                  key={mention.id}
                  onClick={() => addMention(mention)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gugo-green hover:text-gugo-black transition-colors border-b border-gray-200 last:border-0"
                >
                  @{mention.handle}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showHashtags || showMentions) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowHashtags(false)
            setShowMentions(false)
          }}
        />
      )}
    </div>
  )
}