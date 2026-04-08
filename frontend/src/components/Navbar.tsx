"use client"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { User, PlusCircle, LayoutDashboard, Zap } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function Navbar() {
  const { user } = useAuth();
  const { scrollY } = useScroll();
  
  const height = useTransform(scrollY, [0, 50], ["80px", "64px"]);
  const backgroundColor = useTransform(scrollY, [0, 50], ["rgba(2, 6, 23, 0)", "rgba(15, 23, 42, 0.8)"]);
  const borderBottom = useTransform(scrollY, [0, 50], ["1px solid rgba(255, 255, 255, 0)", "1px solid rgba(255, 255, 255, 0.1)"]);

  return (
    <motion.header 
      style={{ height, backgroundColor, borderBottom }}
      className="fixed top-0 left-0 w-full z-50 flex items-center backdrop-blur-xl transition-colors"
    >
      <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rotate-45 group-hover:rotate-90 transition-transform duration-500">
              <Zap size={20} className="-rotate-45 group-hover:-rotate-90 transition-transform duration-500 fill-bg text-bg" />
            </div>
            <div className="absolute -inset-1 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/40 transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tighter leading-none">
              AUCTION<span className="text-primary italic">X</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="pulse-live" />
              <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase">System Live</span>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/50 rounded-lg border border-white/5">
          <Link href="/" className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors rounded-md group">
            <LayoutDashboard size={14} className="text-primary group-hover:scale-110 transition-transform" />
            Deck
          </Link>
          <Link href="/create" className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors rounded-md group">
            <PlusCircle size={14} className="text-primary group-hover:scale-110 transition-transform" />
            Deploy
          </Link>
        </nav>

        {/* Profile / Auth */}
        <div className="flex items-center gap-4">
          {user ? (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-md bg-slate-900 border border-white/10 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                <User size={16} className="text-secondary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-tighter leading-none">{user.username}</span>
                <span className="text-[9px] text-success font-bold uppercase tracking-widest mt-0.5">Verified Operator</span>
              </div>
            </motion.div>
          ) : (
            <Link href="/register" className="btn-precision text-xs tracking-widest">
               Initialize Session
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  )
}
