"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { auctionApi } from "@/lib/api"
import AuctionCard from "@/components/AuctionCard"
import { Auction } from "@/types"

function SkeletonCard() {
  return (
    <div className="glass" style={{ borderRadius: '14px', overflow: 'hidden', height: '340px' }}>
      <div className="skeleton" style={{ height: '3px' }} />
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="skeleton" style={{ height: '12px', width: '60px' }} />
        <div className="skeleton" style={{ height: '20px', width: '80%' }} />
        <div className="skeleton" style={{ height: '14px', width: '100%' }} />
        <div className="skeleton" style={{ height: '14px', width: '70%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
          <div className="skeleton" style={{ height: '68px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '68px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  )
}

function HeroStat({ value, label, color = 'var(--amber)' }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p className="mono" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
    </div>
  )
}

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ALL')
  const [error, setError] = useState('')

  const fetchAuctions = useCallback(async () => {
    setError('')
    try {
      const data = await auctionApi.getAuctions()
      setAuctions(data)
    } catch {
      setError('Could not connect to the backend. Make sure your EC2 instance is running.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuctions()
    const interval = setInterval(fetchAuctions, 15000)
    return () => clearInterval(interval)
  }, [fetchAuctions])

  const filtered = auctions.filter(a => filter === 'ALL' || a.status === filter)
  const activeCount = auctions.filter(a => a.status === 'ACTIVE').length

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh' }}>
      {/* ── Hero ── */}
      <div style={{ position: 'relative', padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(2.5rem, 6vw, 4rem)' }}>
        <div className="container-app">
          <div style={{ maxWidth: '720px', marginBottom: 'clamp(2rem, 5vw, 3.5rem)' }}>
            <div className="badge badge-active" style={{ marginBottom: '1.25rem' }}>
              <div className="live-dot" style={{ transform: 'scale(0.65)' }} />
              {activeCount} Live Auction{activeCount !== 1 ? 's' : ''} · Updated live
            </div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(2.25rem, 6vw, 4rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: '1.25rem',
            }}>
              Bid on premium<br />
              assets in <span style={{ color: 'var(--amber)' }}>real time</span>
            </h1>
            <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '520px' }}>
              Powered by Kafka-backed bidding engine with PostgreSQL optimistic locking. Every bid is atomic, every transaction is final.
            </p>
          </div>

          {/* Stat Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem',
            marginBottom: '2.5rem',
            maxWidth: '600px',
          }}>
            <div className="glass" style={{ borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
              <HeroStat value={`${activeCount}`} label="Active" />
            </div>
            <div className="glass" style={{ borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
              <HeroStat value={`${auctions.length}`} label="Total" color="var(--blue-light)" />
            </div>
            <div className="glass" style={{ borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
              <HeroStat value="1ms" label="Latency" color="var(--emerald)" />
            </div>
            <div className="glass" style={{ borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
              <HeroStat value="∞" label="Scalable" color="var(--violet)" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
            <Link href="/create" className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Listing
            </Link>
            <Link href="/register" className="btn-ghost">Set up your account</Link>
          </div>
        </div>
      </div>

      {/* ── Listings ── */}
      <div className="container-app" style={{ paddingBottom: '5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.25rem, 3vw, 1.625rem)', color: 'var(--text-primary)' }}>
            Browse Listings
          </h2>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', borderRadius: '10px', padding: '0.3rem', border: '1px solid var(--border)' }}>
            {(['ALL', 'ACTIVE', 'ENDED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.8rem', transition: 'all 0.15s',
                  background: filter === f ? 'var(--bg-elevated)' : 'transparent',
                  color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {f === 'ALL' ? 'All' : f === 'ACTIVE' ? '🟢 Active' : '⚫ Ended'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Cannot reach backend</p>
              <p style={{ fontSize: '0.82rem', opacity: 0.8 }}>{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass" style={{ borderRadius: '16px', padding: 'clamp(3rem, 8vw, 5rem)', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <path d="M14 12l-8.5 8.5a2.12 2.12 0 01-3-3L11 9"/><path d="M5 7l4 4"/><path d="m21 3-9 9"/><path d="M21 3H15"/><path d="M21 3V9"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {filter === 'ENDED' ? 'No ended auctions' : 'No active listings yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              {filter === 'ALL' ? 'Be the first one to create an auction listing.' : `No ${filter.toLowerCase()} listings found.`}
            </p>
            {filter === 'ALL' && <Link href="/create" className="btn-primary">Create First Listing</Link>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {filtered.map(auction => (
              <AuctionCard key={auction.id} {...auction} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
