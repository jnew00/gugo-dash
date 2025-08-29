'use client'

import { useState } from 'react'
import { Tweet } from '@prisma/client'
import { MessageCircle, Hash, Hand, Smartphone, ExternalLink } from 'lucide-react'
import GugoButton from './GugoButton'
import ReplyComposer from './ReplyComposer'

interface TweetCardProps {
  tweet: Tweet
  onStatusUpdate: (id: string, status: 'NEW' | 'REPLIED' | 'SKIPPED') => void
}

export default function TweetCard({ tweet, onStatusUpdate }: TweetCardProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  
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

  return (
    <>
      <div className="gugo-card group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getSourceIcon(tweet.source)}
            <div>
              <h3 className="font-bold text-lg text-gugo-dark">{tweet.author}</h3>
              <p className="text-sm text-gugo-brown font-medium">
                {new Date(tweet.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {getStatusBadge(tweet.status)}
        </div>

        <div className="mb-6">
          <p className="text-base leading-relaxed font-medium">
            {tweet.tweetText}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <a 
            href={tweet.tweetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm font-bold text-gugo-brown hover:text-gugo-gold transition-colors duration-300"
          >
            <ExternalLink className="w-4 h-4" />
            <span>VIEW TWEET</span>
          </a>
          
          <div className="flex space-x-3">
            <GugoButton 
              onClick={handleReply}
              disabled={tweet.status === 'REPLIED'}
              className="text-xs py-2 px-4"
            >
              REPLY
            </GugoButton>
            
            <GugoButton 
              variant="secondary"
              onClick={handleSkip}
              disabled={tweet.status === 'REPLIED' || tweet.status === 'SKIPPED'}
              className="text-xs py-2 px-4"
            >
              SKIP
            </GugoButton>
          </div>
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