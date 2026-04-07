"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PlusCircle, Tag, FileText, DollarSign, Calendar, ArrowRight } from "lucide-react"
import { auctionApi } from "@/lib/api"

export default function CreateAuction() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startingPrice, setStartingPrice] = useState("")
  const [endTime, setEndTime] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await auctionApi.createAuction({
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        endTime,
      })
      router.push("/")
    } catch (err) {
      alert("Failed to create auction: " + err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-4 rounded-2xl bg-primary/20 border border-primary/30">
          <PlusCircle size={32} className="text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold font-outfit">List New Item</h1>
          <p className="text-text-dim mt-1">Fill in the details to start a live auction room.</p>
        </div>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass rounded-3xl p-10 grid grid-cols-1 md:grid-cols-2 gap-8 border border-glass-border"
      >
        {/* Left Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-widest px-1">Item Title</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
              <input 
                type="text" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface border border-glass-border rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
                placeholder="e.g. Vintage Rolex Submariner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-widest px-1">Description</label>
            <div className="relative h-full">
              <FileText className="absolute left-4 top-4 text-text-dim" size={18} />
              <textarea 
                required 
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-surface border border-glass-border rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all resize-none"
                placeholder="Tell us about the item's history, condition, and rarity..."
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-widest px-1">Starting Price ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
              <input 
                type="number" 
                required 
                step="0.01"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full bg-surface border border-glass-border rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-dim uppercase tracking-widest px-1">Auction End Time</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
              <input 
                type="datetime-local" 
                required 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-surface border border-glass-border rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-secondary/10 border border-secondary/20 mt-10">
            <p className="text-xs text-text-dim italic leading-relaxed">
              <strong>DevOps Note:</strong> Once created, this item will be broadcasted across the cluster and Kafka event listeners will start tracking it for the payment service.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary justify-center h-14 text-md mt-6"
          >
            {loading ? "Initializing Auction..." : "Launch Auction"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </div>
      </motion.form>
      
      <style jsx>{`
        .mx-auto { margin-left: auto; margin-right: auto; }
        .max-w-4xl { max-width: 56rem; }
        .space-y-6 > * + * { margin-top: 24px; }
        .space-y-2 > * + * { margin-top: 8px; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .gap-12 { gap: 48px; }
        .gap-8 { gap: 32px; }
        .px-4 { padding-left: 16px; padding-right: 16px; }
        .pl-12 { padding-left: 48px; }
        .pr-4 { padding-right: 16px; }
        .py-3 { padding-top: 12px; padding-bottom: 12px; }
        .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .outline-none { outline: 2px solid transparent; outline-offset: 2px; }
        @media (min-width: 768px) {
          .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </div>
  )
}
