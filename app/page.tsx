import Link from 'next/link'
import { Zap, Target, Sparkles, Play, Users } from 'lucide-react'
import GugoDuck from '@/components/GugoDuck'

export default function HomePage() {
  return (
    <div className="gugo-container min-h-screen">
      <header className="gugo-header">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="gugo-logo flex items-center space-x-3">
            <GugoDuck size={50} />
            <span className="font-black">GUGO Dash</span>
          </h1>
          <div className="text-gugo-cream">We Just Run</div>
        </div>
      </header>
      
      <main className="flex flex-col items-center justify-center p-8 py-20">
        <div className="text-center max-w-5xl">
          <div className="bg-gugo-cream border-4 border-gugo-brown rounded-gugo p-12 mb-16 shadow-adventure">
            <div className="flex justify-center mb-6">
              <GugoDuck size={100} />
            </div>
            
            <h2 className="font-gugo-header text-5xl font-black mb-6 text-gugo-dark">
              Run With $GUGO Engagement
            </h2>
            
            <p className="text-lg text-gugo-brown mb-8 leading-relaxed">
              Born in a pool. Forged by loss. Sustained by motion. We engage.
            </p>
            
            <p className="text-2xl font-bold text-gugo-gold mb-12">
              We $GUGO.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/dashboard" className="gugo-button text-center min-w-48 flex items-center justify-center">
                <Play className="w-5 h-5 mr-2" />
                START RUNNING
              </Link>
              
              <button className="gugo-button-secondary min-w-48 flex items-center justify-center" disabled>
                <Users className="w-5 h-5 mr-2" />
                CONNECT X
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="gugo-card text-center">
              <div className="w-16 h-16 bg-gugo-gold border-2 border-gugo-brown mx-auto mb-4 flex items-center justify-center rounded-gugo shadow-adventure">
                <Zap className="w-8 h-8 text-gugo-dark" />
              </div>
              <h3 className="font-gugo-header text-xl font-bold mb-3 text-gugo-dark">Lightning Speed</h3>
              <p className="text-sm text-gugo-brown">Generate AI-powered replies in seconds. Never stop running the conversation.</p>
            </div>
            
            <div className="gugo-card text-center">
              <div className="w-16 h-16 bg-gugo-sage border-2 border-gugo-brown mx-auto mb-4 flex items-center justify-center rounded-gugo shadow-adventure">
                <Target className="w-8 h-8 text-gugo-white" />
              </div>
              <h3 className="font-gugo-header text-xl font-bold mb-3 text-gugo-dark">Perfect Targeting</h3>
              <p className="text-sm text-gugo-brown">Smart engagement across Discord and hashtags. Every interaction counts.</p>
            </div>
            
            <div className="gugo-card text-center">
              <div className="w-16 h-16 bg-gugo-orange border-2 border-gugo-brown mx-auto mb-4 flex items-center justify-center rounded-gugo shadow-adventure">
                <Sparkles className="w-8 h-8 text-gugo-white" />
              </div>
              <h3 className="font-gugo-header text-xl font-bold mb-3 text-gugo-dark">Visual Impact</h3>
              <p className="text-sm text-gugo-brown">Create composite images that make your replies unstoppable.</p>
            </div>
          </div>
          
          <div className="mt-16 p-8 bg-gugo-tan border-2 border-gugo-brown rounded-gugo text-center">
            <p className="text-gugo-dark font-bold text-lg">
              Ready to run with GUGO? Let's engage the adventure.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}