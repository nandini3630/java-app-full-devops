"use client"

import { useEffect, useState, use, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Hammer, Timer, User, TrendingUp, History, Info, AlertCircle, CheckCircle2, Shield, Activity, Zap, ArrowUp } from "lucide-react"
import { auctionApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useAuctionSocket } from "@/hooks/useAuctionSocket"

export default function AuctionRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [auction, setAuction] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [bidAmount, setBidAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" })
  const [priceFlash, setPriceFlash] = useState(false)
  const { user } = useAuth()
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const realTimeBid = useAuctionSocket(id)

  useEffect(() => {
    const loadData = async () => {
      try {
        const item = await auctionApi.getAuction(id)
        setAuction(item)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  useEffect(() => {
    if (realTimeBid) {
      setAuction((prev: any) => ({ ...prev, currentHighestBid: realTimeBid.bidAmount }))
      setBids((prev) => [realTimeBid, ...prev])
      setPriceFlash(true)
      setTimeout(() => setPriceFlash(false), 1000)
      
      if (realTimeBid.username === user?.username) {
        setStatusMsg({ type: "success", text: "TRANSACTION SUCCESSFUL // POSITION SECURED" })
      } else {
        setStatusMsg({ type: "info", text: `SIGNAL DETECTED // NEW BID: $${realTimeBid.bidAmount}` })
      }
    }
  }, [realTimeBid, user?.username])

  const handleQuickBid = (increment: number) => {
    const current = auction?.currentHighestBid || 0
    setBidAmount((current + increment).toString())
  }

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
       setStatusMsg({ type: "error", text: "AUTH_REQUIRED // PLEASE INITIALIZE SESSION" })
       return
    }

    const amount = parseFloat(bidAmount)
    if (amount <= auction.currentHighestBid) {
      setStatusMsg({ type: "error", text: "INVALID_BID // BELOW CURRENT MARKET THRESHOLD" })
      return
    }

    try {
      setStatusMsg({ type: "info", text: "UPLOADING TRANSACTION..." })
      await auctionApi.placeBid(parseInt(id), user.id, amount)
      setBidAmount("")
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "COMMUN_FILTER_ERROR" })
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
       <div className="relative">
         <div className="w-24 h-24 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
         <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={24} className="text-primary animate-pulse" />
         </div>
       </div>
       <p className="mt-8 text-[10px] font-bold tracking-[0.5em] text-primary uppercase">Syncing with Ledger...</p>
    </div>
  )

  if (!auction) return <div className="text-center py-20 text-error">CRITICAL_ERROR: SECTOR_NOT_FOUND</div>

  return (
    <div className="pt-24 pb-32 px-6 lg:px-12 max-w-[1600px] mx-auto">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-8 mb-12 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-slate-900 border border-primary/30 flex items-center justify-center rotate-3 relative">
             <Hammer size={32} className="text-primary -rotate-3" />
             <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary" />
           </div>
           <div>
             <div className="flex items-center gap-3 mb-2">
               <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary tracking-widest uppercase">Lot #{id}</span>
               <div className="flex items-center gap-1.5">
                 <div className="pulse-live" />
                 <span className="text-[9px] font-bold text-success tracking-widest uppercase">{auction.status}</span>
               </div>
             </div>
             <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter uppercase leading-none">{auction.title}</h1>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
           <div className="glass-panel px-6 py-4 rounded-sm flex flex-col min-w-[160px]">
              <span className="text-[9px] uppercase font-bold text-text-muted tracking-widest mb-1">Time Remaining</span>
              <span className="text-xl font-bold font-mono text-primary">LIVE_SESSION</span>
           </div>
           <div className="glass-panel px-6 py-4 rounded-sm flex flex-col min-w-[160px]">
              <span className="text-[9px] uppercase font-bold text-text-muted tracking-widest mb-1">Active Nodes</span>
              <span className="text-xl font-bold font-mono">1,402</span>
           </div>
           <div className="glass-panel px-6 py-4 rounded-sm flex flex-col min-w-[160px] border-primary/20">
              <span className="text-[9px] uppercase font-bold text-text-muted tracking-widest mb-1">Global Rank</span>
              <span className="text-xl font-bold font-mono text-secondary">#1 SECTOR</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Bidding Terminal */}
        <div className="xl:col-span-8 space-y-8">
           <div className="glass-panel rounded-lg overflow-hidden relative">
              {/* Telemetry Grid Overlay */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(var(--primary) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
              
              <div className="p-12 relative z-10">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                       <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Activity size={14} className="text-primary" />
                            <span className="text-[10px] font-bold text-text-muted tracking-[0.3em] uppercase">Market Valuation</span>
                          </div>
                          <motion.div 
                            animate={priceFlash ? { scale: [1, 1.05, 1], color: ["#fff", "#22d3ee", "#fff"] } : {}}
                            className="text-8xl font-bold font-mono tracking-tighter"
                          >
                            ${auction.currentHighestBid.toLocaleString()}
                          </motion.div>
                          <div className="h-1 w-full bg-slate-900 mt-4 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ x: "-100%" }}
                               animate={{ x: "0%" }}
                               transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                               className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                             />
                          </div>
                       </div>

                       <div className="glass-panel p-6 bg-slate-950/40 rounded-sm">
                          <h4 className="text-[10px] font-bold tracking-[0.2em] mb-4 uppercase text-text-muted">Item Intel</h4>
                          <p className="text-sm font-medium leading-relaxed italic text-white/80">
                            &quot;{auction.description}&quot;
                          </p>
                       </div>
                    </div>

                    <div className="bg-slate-900/50 p-8 border border-white/5 rounded-sm">
                       <form onSubmit={handlePlaceBid} className="space-y-8">
                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Transaction Amount</label>
                              <span className="text-[10px] font-bold text-primary uppercase">USD Currency</span>
                            </div>
                            <div className="relative group">
                               <input 
                                 type="number" 
                                 value={bidAmount}
                                 onChange={(e) => setBidAmount(e.target.value)}
                                 className="w-full bg-slate-950 border border-white/10 rounded-sm py-6 px-6 text-4xl font-bold font-mono outline-none focus:border-primary transition-all group-hover:border-white/20"
                                 placeholder="0.00"
                                 required
                               />
                               <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                                  <ArrowUp size={24} className="text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                               {[10, 50, 100].map((inc) => (
                                 <button 
                                   key={inc}
                                   type="button" 
                                   onClick={() => handleQuickBid(inc)}
                                   className="py-2 bg-white/5 border border-white/5 text-[10px] font-bold hover:bg-primary hover:text-bg transition-all uppercase tracking-widest"
                                 >
                                   +{inc}
                                 </button>
                               ))}
                            </div>
                          </div>

                          <button type="submit" className="w-full btn-precision h-20 text-sm tracking-[0.4em]">
                            AUTHORIZE TRANSACTION
                          </button>
                       </form>

                       <AnimatePresence>
                         {statusMsg.text && (
                           <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0 }}
                             className={`mt-8 p-4 border flex items-center gap-4 ${
                               statusMsg.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : 
                               statusMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : 
                               "bg-primary/10 border-primary/20 text-primary"
                             }`}
                           >
                             {statusMsg.type === "error" ? <AlertCircle size={18} /> : <Shield size={18} />}
                             <span className="text-[10px] font-bold tracking-widest uppercase">{statusMsg.text}</span>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-panel p-8 rounded-lg">
                 <div className="flex items-center gap-3 mb-6">
                    <Info size={18} className="text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em]">Network Protocols</h3>
                 </div>
                 <ul className="space-y-4">
                    <li className="flex items-center justify-between py-2 border-b border-white/5">
                       <span className="text-[10px] font-bold text-text-muted uppercase">Latency</span>
                       <span className="text-[10px] font-mono text-success">1.4ms (LOW)</span>
                    </li>
                    <li className="flex items-center justify-between py-2 border-b border-white/5">
                       <span className="text-[10px] font-bold text-text-muted uppercase">Encryption</span>
                       <span className="text-[10px] font-mono text-primary">AES-256 GCM</span>
                    </li>
                    <li className="flex items-center justify-between py-2 border-b border-white/5">
                       <span className="text-[10px] font-bold text-text-muted uppercase">Consensus</span>
                       <span className="text-[10px] font-mono">BFT-SYNC</span>
                    </li>
                 </ul>
              </div>
              <div className="glass-panel p-8 rounded-lg bg-primary/5 border-primary/20">
                 <div className="flex items-center gap-3 mb-6">
                    <Shield size={18} className="text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em]">Guaranteed Escrow</h3>
                 </div>
                 <p className="text-[11px] font-medium leading-loose text-text-muted italic">
                   "All bids placed on the AuctionX terminal are legally binding and secured by our distributed ledger technology. Funds will be auto-settled upon auction expiry."
                 </p>
              </div>
           </div>
        </div>

        {/* Tactical Feed */}
        <div className="xl:col-span-4 h-full">
           <div className="glass-panel rounded-lg h-full min-h-[700px] flex flex-col border-white/5">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <History size={18} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em]">Signal Feed</h3>
                </div>
                <div className="px-2 py-1 bg-primary/10 rounded text-[9px] font-bold text-primary animate-pulse">STREAMING_LIVE</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                <AnimatePresence initial={false}>
                  {bids.map((bid, i) => (
                    <motion.div 
                      key={bid.bidTime || i}
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className={`p-4 rounded-sm border ${bid.username === user?.username ? "bg-primary/10 border-primary/40" : "bg-slate-900 border-white/5"} flex items-center justify-between relative overflow-hidden`}
                    >
                      {bid.username === user?.username && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-sm border ${bid.username === user?.username ? "border-primary/50" : "border-white/10"} flex items-center justify-center bg-slate-950`}>
                           <User size={16} className={bid.username === user?.username ? "text-primary" : "text-text-muted"} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold tracking-tight uppercase">{bid.username}</p>
                          <p className="text-[9px] text-text-muted font-bold font-mono uppercase tracking-widest">
                            {new Date(bid.bidTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className={`text-sm font-bold font-mono ${bid.username === user?.username ? "text-primary" : "text-white"}`}>
                         +${bid.bidAmount.toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {bids.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                    <Activity size={48} className="mb-4" />
                    <p className="text-[10px] font-bold tracking-[0.5em] uppercase">No Signals Captured</p>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-950/40 border-t border-white/5">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Total Activity</span>
                    <span className="text-[9px] font-bold font-mono text-primary">{bids.length} EVENTS</span>
                 </div>
                 <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="w-[15%] h-full bg-primary" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
