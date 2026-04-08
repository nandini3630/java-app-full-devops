"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Timer, ArrowUpRight, TrendingUp, ShieldCheck } from "lucide-react"
import { Auction } from "@/types"

export default function AuctionCard({ id, title, description, currentHighestBid, endTime, status }: Auction) {
  const [timeLeft, setTimeLeft] = useState("")
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const start = end - (24 * 60 * 60 * 1000) // Assume 24h duration for visual progress if not provided
      const total = end - start
      const remaining = end - now
      
      if (remaining <= 0) {
        setTimeLeft("EXPIRED")
        setProgress(0)
        clearInterval(timer)
      } else {
        const h = Math.floor(remaining / (1000 * 60 * 60))
        const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((remaining % (1000 * 60)) / 1000)
        setTimeLeft(`${h}H ${m}M ${s}S`)
        setProgress((remaining / total) * 100)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      viewport={{ once: true }}
      className="glass-panel rounded-lg p-0 relative overflow-hidden group border-white/5 hover:border-primary/30 transition-colors duration-500"
    >
      {/* Top Status Bar */}
      <div className="h-1 w-full bg-slate-800">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
        />
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={12} className="text-primary" />
              <span className="text-[10px] font-bold text-text-muted tracking-[0.2em] uppercase">Secured Lot #{id}</span>
            </div>
            <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{title}</h3>
          </div>
          <div className="px-2 py-1 bg-slate-900 border border-white/10 rounded text-[9px] font-bold text-primary tracking-widest uppercase">
            {status}
          </div>
        </div>

        <p className="text-text-muted text-xs font-medium leading-relaxed line-clamp-2 mb-8 h-8 italic">
          &quot;{description}&quot;
        </p>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5 bg-white/2">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-text-muted tracking-widest flex items-center gap-1.5 mb-2">
              <TrendingUp size={10} className="text-primary" />
              Current Value
            </span>
            <span className="text-2xl font-bold font-mono tracking-tighter text-white">
              ${currentHighestBid.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col border-l border-white/5 pl-4">
            <span className="text-[9px] uppercase font-bold text-text-muted tracking-widest flex items-center gap-1.5 mb-2">
              <Timer size={10} className="text-secondary" />
              Time Remaining
            </span>
            <span className="text-base font-bold font-mono text-primary">
              {timeLeft}
            </span>
          </div>
        </div>

        <div className="mt-8">
          <Link 
            href={`/auction/${id}`} 
            className="w-full btn-precision justify-center text-[11px] tracking-[0.2em] flex items-center gap-3"
          >
            Enter Viewing Room
            <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Decorative Corners */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-white/20" />
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-white/20" />
    </motion.div>
  )
}
