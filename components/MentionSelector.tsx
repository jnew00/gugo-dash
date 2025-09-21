'use client'

import { useState } from 'react'

interface MentionOption {
  handle: string
  label: string
  default?: boolean
}

interface MentionSelectorProps {
  selectedMentions: string[]
  onMentionsChange: (mentions: string[]) => void
}

const DEFAULT_MENTIONS: MentionOption[] = [
  { handle: '@ghostcutter', label: 'GHOSTCUTTER' },
  { handle: '@runwithgugo', label: 'RUN WITH GUGO' },
  { handle: '@ReplyCorp', label: 'REPLY CORP' },
  { handle: '@DDKing987', label: 'DD KING' }
]

export default function MentionSelector({ selectedMentions, onMentionsChange }: MentionSelectorProps) {
  const toggleMention = (handle: string) => {
    if (selectedMentions.includes(handle)) {
      onMentionsChange(selectedMentions.filter(m => m !== handle))
    } else {
      onMentionsChange([...selectedMentions, handle])
    }
  }

  const selectAll = () => {
    onMentionsChange(DEFAULT_MENTIONS.map(m => m.handle))
  }

  const clearAll = () => {
    onMentionsChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-black uppercase text-sm tracking-wide">ADD MENTIONS</h4>
        <div className="flex space-x-2">
          <button
            onClick={selectAll}
            className="text-xs font-black uppercase text-gugo-green hover:text-gugo-black transition-colors"
          >
            ALL
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={clearAll}
            className="text-xs font-black uppercase text-gray-600 hover:text-gugo-black transition-colors"
          >
            NONE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DEFAULT_MENTIONS.map((mention) => (
          <label
            key={mention.handle}
            className={`
              flex items-center space-x-3 p-3 border-2 cursor-pointer transition-all duration-200
              ${selectedMentions.includes(mention.handle) 
                ? 'border-gugo-green bg-gugo-green bg-opacity-10' 
                : 'border-gray-300 hover:border-gugo-black'
              }
            `}
          >
            <input
              type="checkbox"
              checked={selectedMentions.includes(mention.handle)}
              onChange={() => toggleMention(mention.handle)}
              className="sr-only"
            />
            <div className={`
              w-5 h-5 border-2 flex items-center justify-center transition-all duration-200
              ${selectedMentions.includes(mention.handle)
                ? 'border-gugo-green bg-gugo-green'
                : 'border-gugo-black bg-white'
              }
            `}>
              {selectedMentions.includes(mention.handle) && (
                <span className="text-gugo-black font-black text-sm">✓</span>
              )}
            </div>
            <div>
              <p className="font-black text-xs uppercase">{mention.label}</p>
              <p className="text-xs text-gray-600">{mention.handle}</p>
            </div>
          </label>
        ))}
      </div>

      {selectedMentions.length > 0 && (
        <div className="p-3 bg-gray-100 border-2 border-gugo-black">
          <p className="text-xs font-black uppercase mb-1">WILL ADD TO REPLY:</p>
          <p className="text-sm">{selectedMentions.join(' ')}</p>
        </div>
      )}
    </div>
  )
}