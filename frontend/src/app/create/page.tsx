"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PlusCircle, Tag, FileText, DollarSign, Calendar, ArrowRight, Zap, Shield, Activity, Database } from "lucide-react"
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
      alert("FIELD_VALIDATION_ERROR: " + err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-24 pb-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-sm">
            <PlusCircle size={32} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} className="text-secondary" />
              <span className="text-[10px] font-bold text-text-muted tracking-[0.4em] uppercase">Deployment Console // Node_01</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase leading-none">DEPLOY NEW <span className="text-primary">ASSET</span></h1>
          </div>
        </div>
        <div className="px-6 py-3 bg-white/2 border border-white/5 text-[9px] font-bold tracking-[0.2em] uppercase text-text-muted">
          Broadcast Status: <span className="text-success ml-2">READY_FOR_UPSTREAM</span>
        </div>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-12 gap-12"
      >
        {/* Main Configuration Panes */}
        <div className="xl:col-span-8 space-y-8">
           <div className="glass-panel p-10 rounded-lg">
              <h3 className="text-[11px] font-bold tracking-[0.3em] uppercase mb-10 text-primary border-b border-primary/20 pb-4 w-fit">Primary Configuration</h3>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Asset Nomenclature (Title)</label>
                    <Tag size={12} className="text-primary/40" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-sm py-4 px-6 text-xl font-bold font-mono outline-none focus:border-primary transition-all placeholder:text-white/10"
                    placeholder="E.G. QUANTUM_PROCESSOR_V2"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Descriptive Intelligence</label>
                    <FileText size={12} className="text-secondary/40" />
                  </div>
                  <textarea 
                    required 
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-sm py-4 px-6 text-sm font-medium font-mono outline-none focus:border-primary transition-all resize-none placeholder:text-white/10 leading-relaxed"
                    placeholder="ENTRY_DATA: HISTORICAL_RECORD, PHYSICAL_STATE, PROVENANCE..."
                  />
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-panel p-10 rounded-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Start Threshold ($)</label>
                    <DollarSign size={12} className="text-success/40" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    step="0.01"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-sm py-4 px-6 text-2xl font-bold font-mono outline-none focus:border-primary transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="glass-panel p-10 rounded-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Termination Timestamp</label>
                    <Calendar size={12} className="text-primary/40" />
                  </div>
                  <input 
                    type="datetime-local" 
                    required 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-sm py-4 px-6 text-sm font-bold font-mono outline-none focus:border-primary transition-all uppercase"
                  />
                </div>
              </div>
           </div>
        </div>

        {/* Deployment Metadata / Checklist */}
        <div className="xl:col-span-4 space-y-8">
           <div className="glass-panel p-8 rounded-lg bg-slate-900/50">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <Shield size={16} className="text-primary" />
                Pre-Flight Check
              </h3>
              
              <ul className="space-y-6">
                <li className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full border-2 ${title ? "bg-success border-success" : "border-white/10"}`} />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Nomenclature Loaded</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full border-2 ${description.length > 20 ? "bg-success border-success" : "border-white/10"}`} />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Description_Buffer_Min</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full border-2 ${startingPrice ? "bg-success border-success" : "border-white/10"}`} />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Capital Val Verified</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full border-2 ${endTime ? "bg-success border-success" : "border-white/10"}`} />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Expiry_Sync_Active</span>
                </li>
              </ul>

              <div className="mt-12 p-6 bg-secondary/5 border border-secondary/20 rounded-sm">
                 <div className="flex items-center gap-2 mb-3">
                   <Activity size={14} className="text-secondary" />
                   <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em]">DevOps Relay</span>
                 </div>
                 <p className="text-[10px] font-medium leading-relaxed italic text-text-muted">
                   Pushing this resource will trigger the Kafka event bus across the cluster. Notification workers will broadcast the signature to all connected agents.
                 </p>
              </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-precision h-20 text-[11px] tracking-[0.4em] flex items-center justify-center gap-4 group"
                >
                  {loading ? (
                    <span className="animate-pulse">INITIALIZING...</span>
                  ) : (
                    <>
                      <Zap size={18} />
                      DEPLOY TO CLUSTER
                      <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
              </div>
           </div>

           <div className="glass-panel p-8 rounded-lg">
              <div className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4">Relay Status</div>
              <div className="flex items-center gap-2">
                <div className="pulse-live" />
                <span className="text-[9px] font-bold text-success uppercase font-mono">Upstream Connection Nominal</span>
              </div>
           </div>
        </div>
      </motion.form>
    </div>
  )
}
