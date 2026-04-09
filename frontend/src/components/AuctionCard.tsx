"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Auction } from "@/types"

interface CountdownProps {
  endTime: string
}

/** Backend returns timestamps WITHOUT 'Z' (e.g. "2026-04-09T07:10:00"). 
 *  Browsers on IST/non-UTC zones treat these as LOCAL time, making them
 *  5+ hours off. This helper forces UTC interpretation. */
function toUTCMs(dateStr: string): number {
  if (!dateStr) return 0
  // Already has timezone info? Parse as-is. Otherwise append Z for UTC.
  const s = /Z|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z'
  return new Date(s).getTime()
}

function Countdown({ endTime }: CountdownProps) {
  const [display, setDisplay] = useState('')
  const [urgency, setUrgency] = useState<'ok' | 'warn' | 'urgent'>('ok')

  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const end = toUTCMs(endTime)
      const diff = end - now

      if (diff <= 0) { setDisplay('Ended'); return }

      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)

      if (diff < 3600000) setUrgency(diff < 600000 ? 'urgent' : 'warn')
      else setUrgency('ok')

      if (h > 0) setDisplay(`${h}h ${m}m`)
      else if (m > 0) setDisplay(`${m}m ${s}s`)
      else setDisplay(`${s}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endTime])

  const colorMap = { ok: 'var(--emerald)', warn: 'var(--amber)', urgent: 'var(--red)' }

  return (
    <span className="mono" style={{ color: colorMap[urgency], fontWeight: 600, fontSize: '0.85rem' }}>
      {display}
    </span>
  )
}

function ProgressBar({ startTime, endTime }: { startTime: string; endTime: string }) {
  const [pct, setPct] = useState(100)
  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const start = toUTCMs(startTime || endTime) - 24 * 3600000
      const end = toUTCMs(endTime)
      const total = end - start
      const remaining = end - now
      setPct(Math.max(0, Math.min(100, (remaining / total) * 100)))
    }
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [startTime, endTime])

  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function AuctionCard({ id, title, description, currentHighestBid, startingPrice, startTime, endTime, status }: Auction) {
  const isActive = status === 'ACTIVE'

  return (
    <div className="glass card-hover" style={{
      borderRadius: '14px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Top color stripe */}
      <ProgressBar startTime={startTime} endTime={endTime} />

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>
              LOT #{String(id).padStart(3, '0')}
            </p>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3, color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </div>
          <span className={`badge ${isActive ? 'badge-active' : 'badge-ended'}`} style={{ flexShrink: 0 }}>
            {isActive && <div className="live-dot" style={{ transform: 'scale(0.6)' }} />}
            {status}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: 1 }}>
          {description}
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '0.875rem' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>Current Bid</p>
            <p className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--amber)' }}>
              ${currentHighestBid.toLocaleString()}
            </p>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '0.875rem' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
              {isActive ? 'Ends In' : 'Ended'}
            </p>
            <Countdown endTime={endTime} />
          </div>
        </div>

        {/* Starting price */}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Starting price: <span className="mono" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>${startingPrice.toLocaleString()}</span>
        </p>

        {/* CTA */}
        {isActive ? (
          <Link href={`/auction/${id}`} className="btn-primary" style={{ width: '100%' }}>
            Place a Bid
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        ) : (
          <Link href={`/auction/${id}`} className="btn-ghost" style={{ width: '100%' }}>
            View Details
          </Link>
        )}
      </div>
    </div>
  )
}
