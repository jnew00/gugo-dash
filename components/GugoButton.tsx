import React from 'react'

interface GugoButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export default function GugoButton({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  type = 'button',
  className = ''
}: GugoButtonProps) {
  const getBaseClasses = () => {
    if (variant === 'primary') return 'gugo-button'
    if (variant === 'danger') return 'gugo-button-secondary bg-red-500 hover:bg-red-600 text-white border-red-700'
    return 'gugo-button-secondary'
  }
  const baseClasses = getBaseClasses()
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  )
}