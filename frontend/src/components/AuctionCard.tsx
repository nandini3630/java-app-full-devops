"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Timer, ArrowUpRight, TrendingUp } from "lucide-react"

interface AuctionCardProps {
  id: number
  title: string
  description: string
  currentPrice: number
  endTime: string
  status: string
}

export default function AuctionCard({ id, title, description, currentPrice, endTime, status }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft("ENDED")
        clearInterval(timer)
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${h}h ${m}m ${s}s`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden group"
    >
      {/* Active Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{status}</span>
      </div>

      <h3 className="text-xl font-bold font-outfit mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-text-dim text-sm line-clamp-2 mb-6 h-10">{description}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-text-dim tracking-widest flex items-center gap-1">
            <TrendingUp size={12} />
            Current Bid
          </span>
          <span className="text-2xl font-bold text-gradient">${currentPrice.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-text-dim tracking-widest flex items-center gap-1">
            <Timer size={12} />
            Ends In
          </span>
          <span className="text-lg font-medium text-text mt-1">{timeLeft}</span>
        </div>
      </div>

      <Link 
        href={`/auction/${id}`} 
        className="w-full btn-primary justify-center text-sm"
      >
        View Auction
        <ArrowUpRight size={16} />
      </Link>
      
      <style jsx>{`
        .glass-card {
          width: 100%;
          min-width: 320px;
        }
        .text-\[10px\] { font-size: 10px; }
        .text-gradient {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </motion.div>
  )
}
