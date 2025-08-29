'use client'

import { useState, useEffect } from 'react'
import { Tweet } from '@prisma/client'
import { Plus, Zap, RefreshCw } from 'lucide-react'
import GugoHeader from '@/components/GugoHeader'
import TweetCard from '@/components/TweetCard'
import GugoButton from '@/components/GugoButton'

export default function DashboardPage() {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'REPLIED' | 'SKIPPED'>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTweetUrl, setNewTweetUrl] = useState('')

  useEffect(() => {
    fetchTweets()
  }, [])

  const fetchTweets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tweets')
      const data = await response.json()
      setTweets(data.tweets || [])
    } catch (error) {
      console.error('Failed to fetch tweets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTweet = async () => {
    if (!newTweetUrl.trim()) return
    
    try {
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newTweetUrl.trim() })
      })
      
      if (response.ok) {
        setNewTweetUrl('')
        setShowAddModal(false)
        fetchTweets()
      }
    } catch (error) {
      console.error('Failed to add tweet:', error)
    }
  }

  const handleStatusUpdate = async (tweetId: string, status: 'NEW' | 'REPLIED' | 'SKIPPED') => {
    try {
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        setTweets(tweets.map(tweet => 
          tweet.id === tweetId ? { ...tweet, status } : tweet
        ))
      }
    } catch (error) {
      console.error('Failed to update tweet status:', error)
    }
  }

  const filteredTweets = tweets.filter(tweet => 
    filter === 'ALL' || tweet.status === filter
  )

  const getFilterCounts = () => {
    return {
      ALL: tweets.length,
      NEW: tweets.filter(t => t.status === 'NEW').length,
      REPLIED: tweets.filter(t => t.status === 'REPLIED').length,
      SKIPPED: tweets.filter(t => t.status === 'SKIPPED').length,
    }
  }

  const counts = getFilterCounts()

  return (
    <div className="gugo-container">
      <GugoHeader />
      
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-gugo-header text-4xl font-bold mb-2 text-gugo-dark">
                GUGO Engagement Dashboard
              </h1>
              <p className="text-lg font-medium text-gugo-brown">
                Run your Twitter/X engagement with AI-powered replies
              </p>
            </div>
            
            <div className="flex space-x-4">
              <GugoButton onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                ADD TWEET
              </GugoButton>
              
              <GugoButton variant="secondary">
                <RefreshCw className="w-4 h-4 mr-2" />
                SYNC DISCORD
              </GugoButton>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex space-x-3">
              {(['ALL', 'NEW', 'REPLIED', 'SKIPPED'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-5 py-2 text-sm font-black rounded-full border-2 transition-all duration-300 ${
                    filter === filterOption
                      ? 'bg-gugo-gold text-gugo-dark border-gugo-brown shadow-adventure'
                      : 'bg-gugo-cream text-gugo-dark border-gugo-brown hover:bg-gugo-tan hover:shadow-adventure'
                  }`}
                >
                  {filterOption} ({counts[filterOption]})
                </button>
              ))}
            </div>
            
            <div className="text-base">
              <span className="font-black text-gugo-brown">Total: </span>
              <span className="text-2xl font-black text-gugo-gold">{tweets.length}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="gugo-grid gugo-grid-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="gugo-card gugo-loading h-64"></div>
              ))}
            </div>
          ) : filteredTweets.length === 0 ? (
            <div className="gugo-card text-center py-16">
              <Zap className="w-16 h-16 text-gugo-gold mx-auto mb-6" />
              <h2 className="font-gugo-header text-3xl font-bold mb-4">
                {filter === 'ALL' ? 'Ready to Run!' : `No ${filter} Tweets`}
              </h2>
              <p className="text-lg text-gugo-brown mb-8">
                {filter === 'ALL' 
                  ? 'Add your first tweet to start your GUGO engagement journey' 
                  : `Switch to another filter to see tweets in different states`
                }
              </p>
              {filter === 'ALL' && (
                <GugoButton onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  ADD YOUR FIRST TWEET
                </GugoButton>
              )}
            </div>
          ) : (
            <div className="gugo-grid gugo-grid-3">
              {filteredTweets.map((tweet) => (
                <TweetCard 
                  key={tweet.id} 
                  tweet={tweet} 
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <button
        onClick={() => setShowAddModal(true)}
        className="gugo-fab"
        title="Add Tweet"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showAddModal && (
        <div className="gugo-modal-overlay">
          <div className="gugo-modal max-w-2xl">
            <div className="gugo-modal-header">
              <div className="flex items-center justify-between">
                <h2 className="gugo-modal-title">ADD TWEET</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-2xl font-black hover:text-gugo-white transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="font-black uppercase text-sm tracking-wide mb-3 block">
                  TWEET URL
                </label>
                <input
                  type="url"
                  value={newTweetUrl}
                  onChange={(e) => setNewTweetUrl(e.target.value)}
                  placeholder="https://x.com/username/status/..."
                  className="gugo-input w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Paste any Twitter/X URL to add it to your engagement queue
                </p>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4 border-t-2 border-gugo-black">
                <GugoButton variant="secondary" onClick={() => setShowAddModal(false)}>
                  CANCEL
                </GugoButton>
                <GugoButton 
                  onClick={addTweet}
                  disabled={!newTweetUrl.trim()}
                >
                  ADD TWEET
                </GugoButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}