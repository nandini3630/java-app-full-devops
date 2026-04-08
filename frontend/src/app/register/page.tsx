"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, Mail, User, ArrowRight, ShieldCheck, Zap, Activity } from "lucide-react"
import { auctionApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export default function Register() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const userData = await auctionApi.register(username, email)
      login(userData)
      setSuccess(true)
      setTimeout(() => router.push("/"), 2000)
    } catch (err) {
      alert("Registration failed: " + err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen pt-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel rounded-lg p-12 w-full max-w-lg border-white/5 relative overflow-hidden"
      >
        {/* Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
        
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-success/20 rounded-full blur-xl"
                />
                <div className="relative w-full h-full bg-slate-950 border border-success/40 rounded-full flex items-center justify-center">
                  <ShieldCheck size={40} className="text-success" />
                </div>
              </div>
              <h2 className="text-4xl font-bold tracking-tighter mb-4 uppercase">Identity Verified</h2>
              <p className="text-xs font-bold text-text-muted tracking-[0.3em] uppercase">Syncing Session With Global Ledger...</p>
              
              {/* Scanline Effect */}
              <motion.div 
                initial={{ top: "-10%" }}
                animate={{ top: "110%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute left-0 w-full h-px bg-success/40 shadow-[0_0_10px_2px_rgba(52,211,153,0.4)] z-20"
              />
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <Activity size={16} className="text-primary" />
                  <span className="text-[10px] font-bold text-text-muted tracking-[0.4em] uppercase">Security Protocol // Initialize</span>
                </div>
                <h2 className="text-5xl font-bold tracking-tighter uppercase leading-none">JOIN THE <br /><span className="text-primary italic">NETWORK</span></h2>
                <p className="text-xs font-bold text-text-muted tracking-widest mt-6 bg-white/5 w-fit px-3 py-1">AUTH_LEVEL: STAND_BY</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Operator Designation</label>
                    <User size={12} className="text-primary/40" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-sm py-4 px-5 text-lg font-bold font-mono outline-none focus:border-primary transition-all placeholder:text-white/10"
                    placeholder="IDENTIFIER_01"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Comm Channel (Email)</label>
                    <Mail size={12} className="text-secondary/40" />
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-sm py-4 px-5 text-lg font-bold font-mono outline-none focus:border-primary transition-all placeholder:text-white/10"
                    placeholder="PROTOCOL@NETWORK.COM"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-precision h-16 flex items-center justify-center gap-4 group"
                  >
                    {loading ? (
                      <span className="animate-pulse">AUTHORIZING...</span>
                    ) : (
                      <>
                        <Zap size={18} />
                        INITIALIZE SESSION
                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Latency Check</span>
                   <span className="text-[9px] font-bold text-success font-mono uppercase tracking-widest">Optimized (0.4ms)</span>
                 </div>
                 <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck size={12} className="text-primary" />
                   E2E Encrypted
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative Corners */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/20" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/20" />
      </motion.div>
    </div>
  )
}
