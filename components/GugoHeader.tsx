'use client'

import Link from 'next/link'
import { Home, BarChart3, Users, LogOut, Settings } from 'lucide-react'
import { useSession, signIn, signOut } from 'next-auth/react'
import GugoDuck from './GugoDuck'

export default function GugoHeader() {
  const { data: session, status } = useSession()

  return (
    <header className="gugo-header">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="gugo-logo hover:text-gugo-gold transition-colors duration-300 flex items-center space-x-3">
          <GugoDuck size={45} />
          <span className="font-black">GUGO Dash</span>
        </Link>

        <nav className="flex items-center space-x-6">
          <Link
            href="/"
            className="flex items-center space-x-2 font-bold text-sm hover:text-gugo-gold transition-colors duration-300"
          >
            <Home className="w-4 h-4" />
            <span>HOME</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center space-x-2 font-bold text-sm hover:text-gugo-gold transition-colors duration-300"
          >
            <BarChart3 className="w-4 h-4" />
            <span>DASHBOARD</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center space-x-2 font-bold text-sm hover:text-gugo-gold transition-colors duration-300"
          >
            <Settings className="w-4 h-4" />
            <span>ADMIN</span>
          </Link>

          {session ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold">
                @{(session as any).username || 'User'}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 font-bold text-sm hover:text-gugo-gold transition-colors duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span>DISCONNECT</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('twitter')}
              className="flex items-center space-x-2 font-bold text-sm hover:text-gugo-gold transition-colors duration-300"
            >
              <Users className="w-4 h-4" />
              <span>CONNECT X</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}