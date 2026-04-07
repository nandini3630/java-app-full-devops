"use client"

import { useEffect, useState, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Hammer, Timer, User, TrendingUp, History, Info, AlertCircle, CheckCircle2 } from "lucide-react"
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
  const { user } = useAuth()
  
  // Real-time WebSocket hook
  const realTimeBid = useAuctionSocket(id)

  useEffect(() => {
    // Initial data fetch
    const loadData = async () => {
      try {
        const item = await auctionApi.getAuction(id)
        setAuction(item)
        // Note: Realistically we'd fetch bid history too if backend supported it
        // For now we'll collect them real-time plus the starting bid
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  // Handle incoming real-time bids
  useEffect(() => {
    if (realTimeBid) {
      setAuction((prev: any) => ({ ...prev, currentHighestBid: realTimeBid.bidAmount }))
      setBids((prev) => [realTimeBid, ...prev])
      
      if (realTimeBid.username === user?.username) {
        setStatusMsg({ type: "success", text: "Your bid is currently the highest!" })
      } else {
        setStatusMsg({ type: "info", text: `New bid from ${realTimeBid.username}: $${realTimeBid.bidAmount}` })
      }
    }
  }, [realTimeBid, user?.username])

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
       setStatusMsg({ type: "error", text: "You must be signed in to bid." })
       return
    }

    const amount = parseFloat(bidAmount)
    if (amount <= auction.currentHighestBid) {
      setStatusMsg({ type: "error", text: "Bid must be higher than current price." })
      return
    }

    try {
      setStatusMsg({ type: "info", text: "Placing bid..." })
      await auctionApi.placeBid(parseInt(id), user.id, amount)
      setBidAmount("")
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to place bid" })
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  if (!auction) return <div className="text-center py-20">Auction not found.</div>

  return (
    <div className="pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
             <Hammer size={28} className="text-primary" />
           </div>
           <div>
             <h1 className="text-4xl font-bold font-outfit">{auction.title}</h1>
             <p className="text-text-dim text-sm mt-1 flex items-center gap-2">
                <Info size={14} /> Room ID: {id} • Status: <span className="text-primary font-bold">{auction.status}</span>
             </p>
           </div>
        </div>
        
        <div className="glass px-6 py-3 rounded-2xl border border-glass-border flex items-center gap-6">
           <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-dim tracking-widest flex items-center gap-1">Time Remaining</span>
              <span className="text-xl font-mono text-primary font-bold">LIVE EVENT</span>
           </div>
           <div className="w-px h-10 bg-glass-border" />
           <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-dim tracking-widest flex items-center gap-1">Bidders Online</span>
              <span className="text-xl font-bold">12 Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Col: Main Status & Bidding Form */}
        <div className="lg:col-span-2 space-y-8">
           <div className="glass rounded-3xl p-8 border border-glass-border relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 -z-10">
                <TrendingUp size={200} className="text-primary" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div>
                    <h3 className="text-xs font-bold uppercase text-text-dim tracking-[0.2em] mb-4">Current Price</h3>
                    <motion.div 
                      key={auction.currentHighestBid}
                      initial={{ scale: 1.2, color: "#00f2ff" }}
                      animate={{ scale: 1, color: "#ededed" }}
                      className="text-6xl font-bold font-outfit mb-2"
                    >
                      ${auction.currentHighestBid.toLocaleString()}
                    </motion.div>
                    <p className="text-text-dim">Minimum increment: $1.00</p>
                 </div>

                 <div className="flex flex-col justify-center">
                    <form onSubmit={handlePlaceBid} className="space-y-4">
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-text-dim">$</span>
                          <input 
                            type="number" 
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="w-full bg-surface-hover border border-glass-border rounded-2xl py-5 pl-10 pr-4 text-2xl font-bold outline-none focus:border-primary transition-all"
                            placeholder="0.00"
                            required
                          />
                       </div>
                       <button type="submit" className="w-full btn-primary justify-center h-16 text-lg">
                         Place Instant Bid
                       </button>
                    </form>
                 </div>
              </div>

              {/* Status Message */}
              <AnimatePresence>
                {statusMsg.text && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-6 p-4 rounded-xl flex items-center gap-3 border ${
                      statusMsg.type === "error" ? "bg-error/10 border-error/20 text-error" : 
                      statusMsg.type === "success" ? "bg-success/10 border-success/20 text-success" : 
                      "bg-primary/10 border-primary/20 text-primary"
                    }`}
                  >
                    {statusMsg.type === "error" ? <AlertCircle size={20} /> : statusMsg.type === "success" ? <CheckCircle2 size={20} /> : <Info size={20} />}
                    <span className="text-sm font-medium">{statusMsg.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           <div className="glass rounded-3xl p-8 border border-glass-border">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Info size={20} className="text-primary" />
                Item Description
              </h3>
              <p className="text-text-dim leading-relaxed whitespace-pre-wrap">
                {auction.description}
              </p>
           </div>
        </div>

        {/* Right Col: Live Activity Feed */}
        <div className="space-y-6">
           <div className="glass rounded-3xl p-6 border border-glass-border h-full min-h-[500px] flex flex-col">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <History size={18} className="text-primary" />
                Live Activity Feed
              </h3>
              
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {bids.map((bid, i) => (
                    <motion.div 
                      key={bid.bidTime || i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-2xl bg-surface-hover border border-glass-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                           <User size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{bid.username}</p>
                          <p className="text-[10px] text-text-dim uppercase tracking-widest">
                            {new Date(bid.bidTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-primary font-mono font-bold">
                         +${bid.bidAmount.toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {bids.length === 0 && (
                  <div className="text-center py-20 opacity-30 italic text-sm">
                    Waiting for the first bid...
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>

      <style jsx>{`
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .bg-surface-hover { background-color: var(--surface-hover); }
        .text-gradient { background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }
        .text-error { color: var(--error); }
        .bg-error\/10 { background-color: rgba(255, 77, 77, 0.1); }
        .border-error\/20 { border-color: rgba(255, 77, 77, 0.2); }
        .text-success { color: var(--success); }
        .bg-success\/10 { background-color: rgba(0, 255, 136, 0.1); }
        .border-success\/20 { border-color: rgba(0, 255, 136, 0.2); }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
