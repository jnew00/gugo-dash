'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface GugoSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface GugoSelectProps {
  value: string
  onChange: (value: string) => void
  options: GugoSelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  helperText?: string
}

export default function GugoSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  disabled = false,
  className = '',
  helperText
}: GugoSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => options.find(option => option.value === value), [options, value])

  useEffect(() => {
    if (isOpen) {
      const handleClick = (event: MouseEvent) => {
        if (!containerRef.current?.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('mousedown', handleClick)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen])

  const handleOptionClick = (option: GugoSelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex w-full items-center justify-between gap-3 rounded-gugo border-2 border-gugo-brown bg-adventure-card px-4 py-3 text-left transition-all duration-200 shadow-adventure hover:-translate-y-0.5 hover:shadow-golden focus:outline-none focus:ring-4 focus:ring-gugo-gold focus:ring-opacity-40 ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <div className="flex-1 min-w-0">
          <p className="truncate font-black text-sm text-gugo-dark">
            {selected ? selected.label : placeholder}
          </p>
          {selected?.description && (
            <p className="mt-1 text-xs text-gugo-brown/80 break-words">
              {selected.description}
            </p>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gugo-brown transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-gugo border-2 border-gugo-brown bg-gugo-cream shadow-golden">
          <ul className="max-h-64 overflow-y-auto py-2">
            {options.map(option => {
              const isSelected = option.value === selected?.value
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleOptionClick(option)}
                    disabled={option.disabled}
                    className={`flex w-full flex-col items-start gap-1 px-4 py-2 text-left transition-colors ${
                      option.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-gugo-gold/20'
                    } ${isSelected ? 'bg-gugo-gold/30 border-l-4 border-gugo-brown' : ''}`}
                  >
                    <span className="font-black text-sm text-gugo-dark">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-xs text-gugo-brown/80 break-words">
                        {option.description}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
            {options.length === 0 && (
              <li className="px-4 py-2 text-xs text-gugo-brown/70">
                No options available
              </li>
            )}
          </ul>
        </div>
      )}

      {helperText && (
        <p className="mt-2 text-xs text-gugo-brown/80 break-words">{helperText}</p>
      )}
    </div>
  )
}
