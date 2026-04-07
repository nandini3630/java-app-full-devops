"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Gavel, Rocket } from "lucide-react"
import { auctionApi } from "@/lib/api"
import AuctionCard from "@/components/AuctionCard"

export default function Home() {
  const [auctions, setAuctions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auctionApi.getAuctions()
      .then(data => setAuctions(data))
      .catch(err => console.error("Failed to load auctions", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative py-32 px-6 overflow-hidden rounded-[3rem] mb-20">
        {/* Background Image with Overlay */}
        <div 
          className="absolute top-0 left-0 w-full h-full -z-20 bg-cover bg-center transition-transform duration-1000 transform hover:scale-105"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-bg/60 via-bg/80 to-bg -z-10" />
        <div className="absolute top-0 left-0 w-full h-full glass -z-10 opacity-20" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles size={14} />
            Live Bidding Now Open
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-outfit mb-6 leading-tight">
            Bid on the <span className="text-gradient">Future</span>
          </h1>
          
          <p className="text-text-dim text-lg mb-10 max-w-xl mx-auto">
            Experience the world's fastest real-time auction platform. 
            Powered by Kafka, Optimized for DevOps scale.
          </p>

          <div className="flex items-center justify-center gap-6">
            <button className="btn-primary">
              <Rocket size={18} />
              Browse Auctions
            </button>
            <button className="px-8 py-3 rounded-xl border border-glass-border font-semibold hover:bg-surface-hover transition-colors">
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* Auction Grid */}
      <section>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-surface border border-glass-border">
              <Gavel size={24} className="text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-outfit">Active Auctions</h2>
          </div>
          <div className="text-sm font-medium text-text-dim">
            Showing <span className="text-text">{auctions.length}</span> live items
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card h-80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="glass text-center py-20 rounded-3xl border-dashed border-2 border-glass-border">
             <p className="text-text-dim italic">No auctions are live right now. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {auctions.map((auction: any) => (
              <AuctionCard 
                key={auction.id}
                id={auction.id}
                title={auction.title}
                description={auction.description}
                currentPrice={auction.currentHighestBid}
                endTime={auction.endTime}
                status={auction.status}
              />
            ))}
          </div>
        )}
      </section>
      
      <style jsx>{`
        .text-gradient {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .max-w-xl { max-width: 36rem; }
        .max-w-3xl { max-width: 48rem; }
        .max-w-7xl { max-width: 80rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .gap-8 { gap: 32px; }
        .mb-20 { margin-bottom: 80px; }
        .mb-16 { margin-bottom: 64px; }
        .mb-10 { margin-bottom: 40px; }
        .mb-6 { margin-bottom: 24px; }
        .leading-tight { line-height: 1.25; }
        .bg-primary\/10 { background-color: rgba(0, 242, 255, 0.1); }
        .border-primary\/20 { border-color: rgba(0, 242, 255, 0.2); }
        .text-xs { font-size: 0.75rem; }
        .text-lg { font-size: 1.125rem; }
        .text-3xl { font-size: 1.875rem; }
        .text-5xl { font-size: 3rem; }
        .justify-center { justify-content: center; }
        .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        @media (min-width: 768px) {
          .md\:text-7xl { font-size: 4.5rem; }
          .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
    </div>
  )
}
