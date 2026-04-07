"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { UserPlus, Mail, User, ArrowRight, CheckCircle2 } from "lucide-react"
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
    <div className="flex items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-10 w-full max-w-md border border-glass-border relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
        
        {success ? (
          <div className="text-center py-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 size={40} className="text-success" />
            </motion.div>
            <h2 className="text-3xl font-bold font-outfit mb-4">Welcome, {username}!</h2>
            <p className="text-text-dim">You're all set to start bidding. Redirecting to auctions...</p>
          </div>
        ) : (
          <>
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-surface border border-glass-border rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserPlus size={32} className="text-primary" />
              </div>
              <h2 className="text-3xl font-bold font-outfit">Join AuctionX</h2>
              <p className="text-text-dim text-sm mt-3">Register now to place real-time bids and win big.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-dim uppercase tracking-widest px-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                  <input 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-surface border border-glass-border rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
                    placeholder="john_doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-dim uppercase tracking-widest px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface border border-glass-border rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary justify-center h-12 text-md mt-4"
              >
                {loading ? "Creating Account..." : "Create Account"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </>
        )}
      </motion.div>
      
      <style jsx>{`
        .mx-auto { margin-left: auto; margin-right: auto; }
        .text-center { text-align: center; }
        .max-w-md { max-width: 28rem; }
        .space-y-6 > * + * { margin-top: 24px; }
        .space-y-2 > * + * { margin-top: 8px; }
        .min-h-\[80vh\] { min-height: 80vh; }
        .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .border-glass-border { border: 1px solid var(--glass-border); }
        .border-dashed { border-style: dashed; }
      `}</style>
    </div>
  )
}
