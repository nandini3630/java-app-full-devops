"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Hammer, User, PlusCircle, LayoutDashboard } from "lucide-react"
import { useEffect, useState } from "react"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    
    // Simple state check for local "auth"
    const stored = localStorage.getItem("auctionUser")
    if (stored) {
      const data = JSON.parse(stored)
      setUsername(data.username)
    }

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "py-4 glass" : "py-6 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center pulse-primary">
            <Hammer size={22} color="#000" />
          </div>
          <span className="text-xl font-bold font-outfit tracking-tight">
            Auction<span className="text-primary italic">X</span>
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <LayoutDashboard size={18} />
            Auctions
          </Link>
          <Link href="/create" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <PlusCircle size={18} />
            Create
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {username ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-surface-hover border border-glass-border">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <User size={14} color="#000" />
              </div>
              <span className="text-sm font-semibold">{username}</span>
            </div>
          ) : (
            <Link href="/register" className="btn-primary">
               Sign In
            </Link>
          )}
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .flex { display: flex; align-items: center; }
        .justify-between { justify-content: space-between; }
        .gap-3 { gap: 12px; }
        .gap-4 { gap: 16px; }
        .gap-8 { gap: 32px; }
        .px-6 { padding-left: 24px; padding-right: 24px; }
        .py-4 { padding-top: 16px; padding-bottom: 16px; }
        .py-6 { padding-top: 24px; padding-bottom: 24px; }
        .text-xl { font-size: 1.25rem; }
        .font-bold { font-weight: 700; }
        .text-sm { font-size: 0.875rem; }
        .font-medium { font-weight: 500; }
        .transition-all { transition-property: all; }
        .duration-300 { transition-duration: 300ms; }
        .fixed { position: fixed; }
        .top-0 { top: 0; }
        .z-50 { z-index: 50; }
        .italic { font-style: italic; }
        .tracking-tight { letter-spacing: -0.025em; }
        .rounded-xl { border-radius: 12px; }
        .bg-gradient-to-tr { background: linear-gradient(to top right, var(--primary), var(--secondary)); }
        .rounded-full { border-radius: 9999px; }
        .bg-surface-hover { background-color: var(--surface-hover); }
        .border-glass-border { border: 1px solid var(--glass-border); }
        .text-primary { color: var(--primary); }
      `}</style>
    </motion.header>
  )
}
