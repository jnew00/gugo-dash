'use client'

import { useState } from 'react'
import { Tweet } from '@prisma/client'
import { MessageCircle, Hash, Hand, Smartphone, ExternalLink, Trash2, X, RefreshCw } from 'lucide-react'
import GugoButton from './GugoButton'
import ReplyComposer from './ReplyComposer'

interface TweetCardProps {
  tweet: Tweet
  onStatusUpdate: (id: string, status: 'NEW' | 'REPLIED' | 'SKIPPED') => void
  onRemove?: (id: string) => void
  onDeleteFromTwitter?: (id: string) => void
  onRefresh?: (id: string, updatedText: string) => void
}

export default function TweetCard({ tweet, onStatusUpdate, onRemove, onDeleteFromTwitter, onRefresh }: TweetCardProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="gugo-status-new">NEW</span>
      case 'REPLIED':
        return <span className="gugo-status-replied">REPLIED</span>
      case 'SKIPPED':
        return <span className="gugo-status-skipped">SKIPPED</span>
      default:
        return <span className="gugo-status-new">NEW</span>
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'DISCORD':
        return <MessageCircle className="w-6 h-6 text-gugo-sage" />
      case 'HASHTAG':
        return <Hash className="w-6 h-6 text-gugo-blue" />
      case 'MANUAL':
        return <Hand className="w-6 h-6 text-gugo-gold" />
      default:
        return <Smartphone className="w-6 h-6 text-gugo-orange" />
    }
  }

  const handleReply = () => {
    setIsComposerOpen(true)
  }

  const handleSkip = () => {
    onStatusUpdate(tweet.id, 'SKIPPED')
  }

  const handleReplySent = () => {
    setIsComposerOpen(false)
    onStatusUpdate(tweet.id, 'REPLIED')
  }

  const handleRefresh = async () => {
    if (!onRefresh) return

    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/tweets/${tweet.id}/refresh`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.tweet?.tweetText) {
          onRefresh(tweet.id, data.tweet.tweetText)
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to refresh tweet content')
      }
    } catch (error) {
      console.error('Failed to refresh tweet:', error)
      alert('Failed to refresh tweet content')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <>
      <div className="gugo-card group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getSourceIcon(tweet.source)}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <a
                  href={tweet.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-gugo-brown transition-colors"
                >
                  <h3 className="font-bold text-lg text-gugo-dark">@{tweet.author}</h3>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </div>
              <p className="text-sm text-gugo-brown font-medium">
                {new Date(tweet.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(tweet.status)}
            {tweet.tweetText.includes('Sample tweet content') && onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1 text-gray-500 hover:text-blue-500 transition-colors disabled:opacity-50"
                title="Fetch real tweet content"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(tweet.id)}
                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                title="Delete from database"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 h-24 overflow-hidden">
          <p className="text-base leading-relaxed font-medium line-clamp-4">
            {tweet.tweetText}
          </p>
        </div>

        <div className="flex items-center justify-center space-x-3">
          <GugoButton
            onClick={handleReply}
            disabled={tweet.status === 'REPLIED'}
            className="min-w-[100px] rounded-md"
          >
            REPLY
          </GugoButton>

          <GugoButton
            variant="secondary"
            onClick={handleSkip}
            disabled={tweet.status === 'REPLIED' || tweet.status === 'SKIPPED'}
            className="min-w-[100px] rounded-md"
          >
            SKIP
          </GugoButton>

          {onDeleteFromTwitter && tweet.status === 'REPLIED' && (
            <GugoButton
              variant="danger"
              onClick={() => {
                if (confirm('Delete your reply from Twitter/X? This cannot be undone!')) {
                  onDeleteFromTwitter(tweet.id)
                }
              }}
              className="min-w-[100px] rounded-md"
              title="Delete your reply from Twitter/X"
            >
              DELETE
            </GugoButton>
          )}
        </div>
      </div>

      {isComposerOpen && (
        <ReplyComposer
          tweet={tweet}
          onClose={() => setIsComposerOpen(false)}
          onReplySent={handleReplySent}
        />
      )}
    </>
  )
}