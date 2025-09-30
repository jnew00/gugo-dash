'use client'

import { useState, useEffect } from 'react'
import { Tweet } from '@prisma/client'
import GugoButton from './GugoButton'
import ImageGallery from './ImageGallery'
import HashtagMentionSelector from './HashtagMentionSelector'
import MemeSelector from './MemeSelector'

interface ReplyComposerProps {
  tweet: Tweet
  onClose: () => void
  onReplySent: () => void
}

export default function ReplyComposer({ tweet, onClose, onReplySent }: ReplyComposerProps) {
  const [replyText, setReplyText] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [selectedMeme, setSelectedMeme] = useState<string | null>(null)
  const [showMemeSelector, setShowMemeSelector] = useState(false)
  const [aiProvider, setAiProvider] = useState<string>('')

  // Auto-generate suggestions when modal opens
  useEffect(() => {
    generateSuggestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateSuggestions = async () => {
    setIsGenerating(true)
    setAiProvider('Generating with AI...')
    try {
      const response = await fetch('/api/replies/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetText: tweet.tweetText, tweetAuthor: tweet.author })
      })

      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setAiProvider(data.provider ? `Generated with ${data.provider}` : '')

      // Auto-select first suggestion if available
      if (data.suggestions && data.suggestions.length > 0 && !replyText) {
        setReplyText(data.suggestions[0])
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      setAiProvider('Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const postReply = async () => {
    if (!replyText.trim()) return

    setIsPosting(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/replies/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweetId: tweet.tweetId,
          replyText,
          imageId: selectedImage,
          memeId: selectedMeme
        })
      })

      if (response.ok) {
        onReplySent()
      } else {
        // Handle error response
        const errorData = await response.json()
        setErrorMessage(errorData.error || 'Failed to post reply')
      }
    } catch (error) {
      console.error('Failed to post reply:', error)
      setErrorMessage('Network error - please check your connection')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="gugo-modal-overlay">
      <div className="gugo-modal">
        <div className="gugo-modal-header">
          <div className="flex items-center justify-between">
            <h2 className="gugo-modal-title">COMPOSE REPLY</h2>
            <button 
              onClick={onClose}
              className="text-2xl font-black hover:text-gugo-white transition-colors duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="gugo-card bg-gray-50">
            <h3 className="font-black uppercase text-sm mb-3 text-gray-600">ORIGINAL TWEET</h3>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">👤</div>
              <div>
                <h4 className="font-black">{tweet.author}</h4>
                <p className="text-sm leading-relaxed mt-2">{tweet.tweetText}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="font-black uppercase text-sm tracking-wide">
                YOUR REPLY
                {aiProvider && (
                  <span className="text-xs text-gugo-green ml-2 font-normal">
                    ({aiProvider})
                  </span>
                )}
              </label>
              <div className="flex space-x-3">
                <GugoButton
                  onClick={generateSuggestions}
                  disabled={isGenerating}
                  className="text-xs py-2 px-4"
                >
                  {isGenerating ? 'GENERATING...' : 'REGENERATE AI'}
                </GugoButton>
                <GugoButton
                  variant="secondary"
                  onClick={() => setShowMemeSelector(!showMemeSelector)}
                  className="text-xs py-2 px-4"
                >
                  {showMemeSelector ? 'HIDE MEMES' : 'ADD MEME'}
                </GugoButton>
                <GugoButton
                  variant="secondary"
                  onClick={() => setShowImageGallery(!showImageGallery)}
                  className="text-xs py-2 px-4"
                >
                  {showImageGallery ? 'HIDE IMAGES' : 'ADD IMAGE'}
                </GugoButton>
              </div>
            </div>

            {/* Hashtag and Mention Selector */}
            <HashtagMentionSelector
              replyText={replyText}
              onUpdateReply={setReplyText}
            />
            
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              className="gugo-textarea w-full h-32 mb-4"
            />

            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-black uppercase text-sm">AI SUGGESTIONS</h4>
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="p-4 border-2 border-gray-300 hover:border-gugo-green cursor-pointer transition-all duration-200"
                    onClick={() => setReplyText(suggestion)}
                  >
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showMemeSelector && (
            <MemeSelector
              selectedMeme={selectedMeme}
              onMemeSelect={setSelectedMeme}
              tweetText={tweet.tweetText}
              tweetAuthor={tweet.author}
            />
          )}

          {showImageGallery && (
            <ImageGallery
              selectedImage={selectedImage}
              onImageSelect={setSelectedImage}
            />
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-100 border-2 border-red-500 rounded p-3 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-500 font-black text-sm">❌ ERROR:</span>
                <span className="text-red-700 text-sm">{errorMessage}</span>
              </div>
              {(errorMessage.includes('authentication') || errorMessage.includes('login')) && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      import('next-auth/react').then(({ signIn }) => {
                        signIn('twitter')
                      })
                    }}
                    className="text-xs bg-red-500 text-white px-3 py-1 rounded font-bold hover:bg-red-600 transition-colors"
                  >
                    RECONNECT TWITTER
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t-2 border-gugo-black">
            <div className="text-sm">
              <span className="font-black">Characters: </span>
              <span className={replyText.length > 280 ? 'text-red-500' : ''}>{replyText.length}/280</span>
            </div>
            
            <div className="flex space-x-4">
              <GugoButton variant="secondary" onClick={onClose}>
                CANCEL
              </GugoButton>
              <GugoButton 
                onClick={postReply}
                disabled={!replyText.trim() || isPosting || replyText.length > 280}
              >
                {isPosting ? 'POSTING...' : 'POST REPLY'}
              </GugoButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}