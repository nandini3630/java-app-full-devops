"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Gavel, Rocket, Activity, Users, Shield } from "lucide-react"
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
    <div className="pt-24 pb-32 px-6 lg:px-12 max-w-[1600px] mx-auto">
      {/* 1. System Telemetry / Hero Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-32 items-center">
        <div className="lg:col-span-7">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-8 bg-primary/5 border border-primary/20 w-fit px-4 py-1.5 rounded-sm"
          >
            <Activity size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Network Connected // High Availability</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl lg:text-8xl font-bold leading-none mb-8 tracking-tighter"
          >
            PRECISION <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">LIQUIDATION</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-text-muted font-medium max-w-xl mb-12 leading-relaxed"
          >
            Deploy capital into high-stakes digital assets. Our ultra-low latency infrastructure ensures your bid hits the ledger first. No slippage. No delays.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-6"
          >
            <button className="btn-precision px-12 py-4">
              Access Terminal
            </button>
            <button className="px-8 py-4 text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-3">
              Technical Specs
              <Shield size={16} className="text-secondary" />
            </button>
          </motion.div>
        </div>

        {/* Telemetry Stats Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-5 grid grid-cols-2 gap-px bg-white/5 border border-white/10 rounded-lg overflow-hidden glass-panel"
        >
          <div className="p-8 bg-slate-950/40">
            <Users size={20} className="text-primary mb-4" />
            <div className="text-2xl font-bold font-mono">14.2K</div>
            <div className="text-[9px] font-bold text-text-muted tracking-[0.2em] uppercase mt-1">Active Nodes</div>
          </div>
          <div className="p-8 bg-slate-950/40">
            <Activity size={20} className="text-secondary mb-4" />
            <div className="text-2xl font-bold font-mono">1.2ms</div>
            <div className="text-[9px] font-bold text-text-muted tracking-[0.2em] uppercase mt-1">Avg Latency</div>
          </div>
          <div className="p-8 bg-slate-950/40">
            <Rocket size={20} className="text-success mb-4" />
            <div className="text-2xl font-bold font-mono">$4.2M</div>
            <div className="text-[9px] font-bold text-text-muted tracking-[0.2em] uppercase mt-1">Volume 24H</div>
          </div>
          <div className="p-8 bg-slate-950/40 border-l border-white/5">
            <Gavel size={20} className="text-primary mb-4" />
            <div className="text-2xl font-bold font-mono">842</div>
            <div className="text-[9px] font-bold text-text-muted tracking-[0.2em] uppercase mt-1">Live Events</div>
          </div>
        </motion.div>
      </section>

      {/* 2. Active Auctions Grid */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-1 bg-primary" />
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2 uppercase italic">Active Operations</h2>
              <p className="text-xs font-bold text-text-muted tracking-widest uppercase">Verified Real-Time Auction Ledger</p>
            </div>
          </div>
          <div className="px-6 py-3 bg-white/2 rounded-full border border-white/5 text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted">
            Ledger Count: <span className="text-white ml-2">{auctions.length} Items</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-panel h-[400px] rounded-lg animate-pulse bg-white/5" />
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="glass-panel text-center py-32 rounded-lg border-white/5">
             <div className="text-primary mb-6">
               <Shield size={48} className="mx-auto opacity-20" />
             </div>
             <p className="text-xs font-bold tracking-[0.4em] uppercase text-text-muted">No Active Signals Detected In This Sector</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
    </div>
  )
}
