import Link from 'next/link'
import { Home, BarChart3, Users } from 'lucide-react'
import GugoDuck from './GugoDuck'

export default function GugoHeader() {
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
          
          <button className="flex items-center space-x-2 font-bold text-sm hover:text-gugo-gold transition-colors duration-300">
            <Users className="w-4 h-4" />
            <span>CONNECT X</span>
          </button>
        </nav>
      </div>
    </header>
  )
}