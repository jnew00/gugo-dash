'use client'

import { useState, useEffect } from 'react'
import GugoHeader from '@/components/GugoHeader'

interface Meme {
  id: string
  filename: string
  path: string
  tags: string[]
  description?: string
  analyzed: boolean
  uploadedAt: string
}

interface Hashtag {
  id: string
  tag: string
  active: boolean
  createdAt: string
}

interface Mention {
  id: string
  handle: string
  active: boolean
  createdAt: string
}

interface AdminSettings {
  textProvider: string
  imageProvider: string
  memeMatchModel: string
  memeAnalysisModel: string
}

interface LLMConfig {
  baseUrl: string
  textModel: string
  visionModel: string
  model: string // Legacy field
}

export default function AdminPage() {
  const [memes, setMemes] = useState<Meme[]>([])
  const [hashtags, setHashtags] = useState<Hashtag[]>([])
  const [mentions, setMentions] = useState<Mention[]>([])
  const [newHashtag, setNewHashtag] = useState<string>('')
  const [newMention, setNewMention] = useState<string>('')
  const [settings, setSettings] = useState<AdminSettings>({
    textProvider: 'local',
    imageProvider: 'together',
    memeMatchModel: 'local',
    memeAnalysisModel: 'local'
  })
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    baseUrl: 'Loading...',
    textModel: 'Loading...',
    visionModel: 'Loading...',
    model: 'Loading...'
  })
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMemes()
    fetchSettings()
    fetchLLMConfig()
    fetchHashtags()
    fetchMentions()
  }, [])

  const fetchMemes = async () => {
    try {
      const response = await fetch('/api/memes')
      if (response.ok) {
        const data = await response.json()
        setMemes(data)
      }
    } catch (error) {
      console.error('Failed to fetch memes:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchLLMConfig = async () => {
    try {
      const response = await fetch('/api/admin/llm-config')
      if (response.ok) {
        const data = await response.json()
        setLlmConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch LLM config:', error)
    }
  }

  const fetchHashtags = async () => {
    try {
      const response = await fetch('/api/hashtags')
      if (response.ok) {
        const data = await response.json()
        setHashtags(data)
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
        setMentions(data)
      }
    } catch (error) {
      console.error('Failed to fetch mentions:', error)
    }
  }

  const addHashtag = async () => {
    if (!newHashtag.trim()) return

    try {
      const response = await fetch('/api/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newHashtag })
      })

      if (response.ok) {
        fetchHashtags()
        setNewHashtag('')
        setUploadStatus('Hashtag added successfully')
        setTimeout(() => setUploadStatus(''), 3000)
      }
    } catch (error) {
      console.error('Failed to add hashtag:', error)
    }
  }

  const deleteHashtag = async (id: string) => {
    if (!confirm('Delete this hashtag?')) return

    try {
      const response = await fetch(`/api/hashtags?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchHashtags()
        setUploadStatus('Hashtag deleted')
        setTimeout(() => setUploadStatus(''), 3000)
      }
    } catch (error) {
      console.error('Failed to delete hashtag:', error)
    }
  }

  const addMention = async () => {
    if (!newMention.trim()) return

    try {
      const response = await fetch('/api/mentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: newMention })
      })

      if (response.ok) {
        fetchMentions()
        setNewMention('')
        setUploadStatus('Mention added successfully')
        setTimeout(() => setUploadStatus(''), 3000)
      }
    } catch (error) {
      console.error('Failed to add mention:', error)
    }
  }

  const deleteMention = async (id: string) => {
    if (!confirm('Delete this mention?')) return

    try {
      const response = await fetch(`/api/mentions?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchMentions()
        setUploadStatus('Mention deleted')
        setTimeout(() => setUploadStatus(''), 3000)
      }
    } catch (error) {
      console.error('Failed to delete mention:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setLoading(true)
    setUploadStatus('Uploading...')

    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      const response = await fetch('/api/memes/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setUploadStatus('Upload successful!')
        fetchMemes()
        // Clear the input
        event.target.value = ''
      } else {
        setUploadStatus('Upload failed')
      }
    } catch (error) {
      setUploadStatus('Upload error')
      console.error('Upload error:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setUploadStatus(''), 3000)
    }
  }

  const handleSettingsUpdate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setUploadStatus('Settings updated!')
      } else {
        setUploadStatus('Settings update failed')
      }
    } catch (error) {
      setUploadStatus('Settings update error')
      console.error('Settings update error:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setUploadStatus(''), 3000)
    }
  }

  const handleDeleteMeme = async (memeId: string) => {
    if (!confirm('Delete this meme?')) return

    try {
      const response = await fetch(`/api/memes/${memeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchMemes()
        setUploadStatus('Meme deleted')
        setTimeout(() => setUploadStatus(''), 3000)
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const updateMemeTags = async (memeId: string, tags: string[]) => {
    try {
      const response = await fetch(`/api/memes/${memeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      })

      if (response.ok) {
        fetchMemes()
      }
    } catch (error) {
      console.error('Tag update error:', error)
    }
  }

  const updateMemeDescription = async (memeId: string, description: string) => {
    try {
      const response = await fetch(`/api/memes/${memeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      })

      if (response.ok) {
        fetchMemes()
      }
    } catch (error) {
      console.error('Description update error:', error)
    }
  }

  const analyzeMeme = async (memeId: string) => {
    setLoading(true)
    setUploadStatus('Analyzing meme...')

    try {
      const response = await fetch('/api/memes/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memeId }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Analysis response:', data)
        setUploadStatus(`Analysis complete: ${data.analysis?.statusMessage || 'Success'}`)
        fetchMemes()
      } else {
        const errorText = await response.text()
        console.error('Analysis failed:', response.status, errorText)
        setUploadStatus(`Analysis failed: ${response.status}`)
      }
    } catch (error) {
      setUploadStatus('Analysis error')
      console.error('Analysis error:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setUploadStatus(''), 3000)
    }
  }

  const analyzeAllMemes = async () => {
    if (!confirm('Analyze all unanalyzed memes? This may take several minutes.')) return

    setLoading(true)
    setUploadStatus('Starting batch analysis...')

    try {
      const response = await fetch('/api/memes/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analyzeAll: true }),
      })

      if (response.ok) {
        const data = await response.json()
        setUploadStatus(`Batch analysis complete: ${data.analyzed} analyzed, ${data.failed || 0} failed`)
        fetchMemes()
      } else {
        setUploadStatus('Batch analysis failed')
      }
    } catch (error) {
      setUploadStatus('Batch analysis error')
      console.error('Batch analysis error:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setUploadStatus(''), 5000)
    }
  }

  const resetMemeAnalysis = async (memeId: string) => {
    if (!confirm('Reset this meme analysis? It will be marked as unanalyzed.')) return

    setLoading(true)
    setUploadStatus('Resetting meme analysis...')

    try {
      const response = await fetch(`/api/memes/${memeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analyzed: false }),
      })

      if (response.ok) {
        setUploadStatus('Meme reset successfully')
        fetchMemes()
      } else {
        setUploadStatus('Reset failed')
      }
    } catch (error) {
      setUploadStatus('Reset error')
      console.error('Reset error:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setUploadStatus(''), 3000)
    }
  }

  const importGugoMemes = async () => {
    setLoading(true)
    setUploadStatus('Discovering GUGO memes...')

    try {
      // First discover the memes from the GUGO website
      const discoverResponse = await fetch('/api/memes/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://runwithgugo.com/memes' }),
      })

      if (!discoverResponse.ok) {
        setUploadStatus('Failed to discover GUGO memes')
        return
      }

      const discoverData = await discoverResponse.json()
      const urls = discoverData.urls || []

      if (urls.length === 0) {
        setUploadStatus('No GUGO memes found')
        return
      }

      setUploadStatus(`Found ${urls.length} GUGO memes, importing...`)

      // Now import the discovered memes
      const importResponse = await fetch('/api/memes/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      })

      if (importResponse.ok) {
        const importData = await importResponse.json()
        setUploadStatus(`Successfully imported ${importData.imported?.length || 0} GUGO memes!`)
        fetchMemes()
      } else {
        setUploadStatus('Failed to import GUGO memes')
      }
    } catch (error) {
      setUploadStatus('Error importing GUGO memes')
      console.error('Import error:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setUploadStatus(''), 5000)
    }
  }

  return (
    <div className="gugo-bg min-h-screen">
      <GugoHeader />

      <div className="max-w-6xl mx-auto p-6">
        <h1 className="gugo-title mb-8">ADMIN CONTROL</h1>

        {/* LLM Settings */}
        <div className="gugo-card mb-8">
          <h2 className="gugo-subtitle mb-6">LLM PROVIDER SETTINGS</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="gugo-label">TEXT PROVIDER</label>
              <select
                value={settings.textProvider}
                onChange={(e) => setSettings({...settings, textProvider: e.target.value})}
                className="gugo-select"
              >
                <option value="local">Local LLM (Ollama/LM Studio)</option>
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label className="gugo-label">IMAGE PROVIDER</label>
              <select
                value={settings.imageProvider}
                onChange={(e) => setSettings({...settings, imageProvider: e.target.value})}
                className="gugo-select"
              >
                <option value="together">Together.ai</option>
                <option value="openai">OpenAI DALL-E</option>
                <option value="stability">Stability AI</option>
              </select>
            </div>

            <div>
              <label className="gugo-label">MEME MATCHING MODEL</label>
              <select
                value={settings.memeMatchModel}
                onChange={(e) => setSettings({...settings, memeMatchModel: e.target.value})}
                className="gugo-select"
              >
                <option value="local">Local LLM (Ollama/LM Studio)</option>
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label className="gugo-label">MEME ANALYSIS MODEL</label>
              <select
                value={settings.memeAnalysisModel}
                onChange={(e) => setSettings({...settings, memeAnalysisModel: e.target.value})}
                className="gugo-select"
              >
                <option value="local">Local LLM (Fallback only)</option>
                <option value="openai">OpenAI GPT-4 Vision</option>
                <option value="deepseek">DeepSeek (Fallback only)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSettingsUpdate}
            disabled={loading}
            className="gugo-button gugo-button-primary"
          >
            UPDATE SETTINGS
          </button>

          {/* Local LLM Info */}
          {(settings.textProvider === 'local' || settings.memeMatchModel === 'local') && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-bold text-sm text-blue-900 mb-2">Current Local LLM Configuration (JIT Loading)</h3>
              <div className="text-xs text-blue-800 space-y-2">
                <div>
                  <strong>Base URL:</strong> <code className="bg-blue-100 px-1 rounded">{llmConfig.baseUrl}</code>
                </div>
                <div>
                  <strong>Text Model:</strong> <code className="bg-blue-100 px-1 rounded">{llmConfig.textModel}</code>
                </div>
                <div>
                  <strong>Vision Model:</strong> <code className="bg-blue-100 px-1 rounded">{llmConfig.visionModel}</code>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200">
                  <p className="text-blue-700">
                    Configure in <strong>.env</strong> file for JIT loading:
                  </p>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• <code>LOCAL_LLM_BASE={llmConfig.baseUrl}</code></li>
                    <li>• <code>LOCAL_TEXT_MODEL={llmConfig.textModel}</code> (for replies)</li>
                    <li>• <code>LOCAL_VISION_MODEL={llmConfig.visionModel}</code> (for meme analysis)</li>
                  </ul>
                  <p className="text-blue-600 mt-2 text-xs">
                    LM Studio will automatically load the appropriate model based on the task.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hashtags & Mentions Management */}
        <div className="gugo-card mb-8">
          <h2 className="gugo-subtitle mb-6">HASHTAGS & MENTIONS</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hashtags Section */}
            <div>
              <label className="gugo-label">HASHTAGS (for quick reply additions)</label>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="Add hashtag (without #)"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addHashtag()
                    }
                  }}
                  className="flex-1 gugo-input"
                />
                <button
                  onClick={addHashtag}
                  disabled={loading || !newHashtag.trim()}
                  className="gugo-button gugo-button-primary"
                >
                  ADD
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {hashtags.length === 0 ? (
                  <p className="text-sm text-gray-500">No hashtags added yet</p>
                ) : (
                  hashtags.map((hashtag) => (
                    <div
                      key={hashtag.id}
                      className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded"
                    >
                      <span className="text-sm font-medium">#{hashtag.tag}</span>
                      <button
                        onClick={() => deleteHashtag(hashtag.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mentions Section */}
            <div>
              <label className="gugo-label">MENTIONS (for quick reply additions)</label>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="Add mention (without @)"
                  value={newMention}
                  onChange={(e) => setNewMention(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addMention()
                    }
                  }}
                  className="flex-1 gugo-input"
                />
                <button
                  onClick={addMention}
                  disabled={loading || !newMention.trim()}
                  className="gugo-button gugo-button-primary"
                >
                  ADD
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mentions.length === 0 ? (
                  <p className="text-sm text-gray-500">No mentions added yet</p>
                ) : (
                  mentions.map((mention) => (
                    <div
                      key={mention.id}
                      className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded"
                    >
                      <span className="text-sm font-medium">@{mention.handle}</span>
                      <button
                        onClick={() => deleteMention(mention.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Meme Upload */}
        <div className="gugo-card mb-8">
          <h2 className="gugo-subtitle mb-6">MEME UPLOAD</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="gugo-label">MANUAL UPLOAD (GIF, PNG, JPG)</label>
              <input
                type="file"
                multiple
                accept=".gif,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={loading}
                className="gugo-file-input"
              />
            </div>

            <div>
              <label className="gugo-label">IMPORT FROM GUGO WEBSITE</label>
              <button
                onClick={importGugoMemes}
                disabled={loading}
                className="w-full gugo-button gugo-button-primary mb-3"
              >
                {loading ? 'IMPORTING...' : 'IMPORT GUGO MEMES'}
              </button>
              <p className="text-xs text-gray-600 mb-4">
                Automatically discovers and imports memes from runwithgugo.com/memes
              </p>

              <label className="gugo-label">AI ANALYSIS</label>
              <button
                onClick={analyzeAllMemes}
                disabled={loading}
                className="w-full gugo-button gugo-button-secondary"
              >
                {loading ? 'ANALYZING...' : 'ANALYZE ALL UNANALYZED'}
              </button>
              <p className="text-xs text-gray-600 mt-2">
                Generate AI descriptions and tags for memes without analysis
              </p>
            </div>
          </div>

          {uploadStatus && (
            <div className={`gugo-status mt-4 ${uploadStatus.includes('success') || uploadStatus.includes('updated') || uploadStatus.includes('imported') ? 'gugo-status-success' : 'gugo-status-error'}`}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Meme Gallery */}
        <div className="gugo-card">
          <h2 className="gugo-subtitle mb-6">MEME POOL ({memes.length})</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {memes.map((meme) => (
              <div key={meme.id} className="gugo-meme-item">
                <div className="relative group">
                  <img
                    src={`/api/memes/serve/${meme.filename}`}
                    alt={meme.description || meme.filename}
                    className="w-full h-32 object-cover gugo-border"
                  />

                  <button
                    onClick={() => handleDeleteMeme(meme.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>

                <div className="p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs gugo-text truncate font-medium flex-1">
                      {meme.filename}
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {!meme.analyzed && (
                        <button
                          onClick={() => analyzeMeme(meme.id)}
                          disabled={loading}
                          className="bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                          title="Analyze with AI"
                        >
                          AI
                        </button>
                      )}
                      {meme.analyzed && (
                        <>
                          <span
                            className="bg-green-500 text-white text-xs px-2 py-1 rounded"
                            title="Already analyzed"
                          >
                            ✓
                          </span>
                          <button
                            onClick={() => resetMemeAnalysis(meme.id)}
                            disabled={loading}
                            className="bg-orange-500 text-white text-xs px-2 py-1 rounded hover:bg-orange-600 disabled:opacity-50"
                            title="Reset analysis - mark as unanalyzed"
                          >
                            ↻
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <textarea
                    placeholder="Description (detailed context helps AI matching)"
                    defaultValue={meme.description || ''}
                    onBlur={(e) => {
                      updateMemeDescription(meme.id, e.target.value)
                    }}
                    className="w-full text-xs p-1 gugo-input-small resize-none"
                    rows={2}
                  />

                  <input
                    type="text"
                    placeholder="Tags (optional - comma separated)"
                    defaultValue={meme.tags.join(', ')}
                    onBlur={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                      updateMemeTags(meme.id, tags)
                    }}
                    className="w-full text-xs p-1 gugo-input-small"
                  />
                </div>
              </div>
            ))}
          </div>

          {memes.length === 0 && (
            <div className="text-center py-12 gugo-text-muted">
              NO MEMES UPLOADED YET
            </div>
          )}
        </div>
      </div>
    </div>
  )
}