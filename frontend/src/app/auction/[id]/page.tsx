"use client"

import { useEffect, useState, use, useCallback } from "react"
import Link from "next/link"
import { auctionApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useAuctionSocket } from "@/hooks/useAuctionSocket"
import { Auction, Bid } from "@/types"

/** Backend returns timestamps WITHOUT 'Z'. Browsers on IST/non-UTC
 *  treat them as local time — 5.5 hrs off for IST users. Force UTC. */
function toUTCMs(dateStr: string): number {
  if (!dateStr) return 0
  const s = /Z|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z'
  return new Date(s).getTime()
}

function Countdown({ endTime }: { endTime: string }) {
  const [parts, setParts] = useState({ h: 0, m: 0, s: 0, ended: false, urgent: false })
  useEffect(() => {
    const update = () => {
      const diff = toUTCMs(endTime) - Date.now()
      if (diff <= 0) { setParts({ h: 0, m: 0, s: 0, ended: true, urgent: false }); return }
      setParts({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000), ended: false, urgent: diff < 600000 })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endTime])

  if (parts.ended) return <span style={{ color: 'var(--red)', fontWeight: 700 }}>Auction ended</span>
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {[{ v: parts.h, l: 'Hours' }, { v: parts.m, l: 'Minutes' }, { v: parts.s, l: 'Seconds' }].map(({ v, l }) => (
        <div key={l} style={{ textAlign: 'center', minWidth: '64px', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '0.875rem 1rem', border: parts.urgent ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)' }}>
          <p className="mono" style={{ fontSize: '1.625rem', fontWeight: 800, color: parts.urgent ? 'var(--red)' : 'var(--text-primary)', lineHeight: 1 }}>{String(v).padStart(2, '0')}</p>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.25rem' }}>{l}</p>
        </div>
      ))}
    </div>
  )
}

type StatusType = { type: 'success' | 'error' | 'warning' | 'info'; message: string } | null

function StatusAlert({ status, onDismiss }: { status: StatusType; onDismiss: () => void }) {
  if (!status) return null
  const icons: Record<string, string> = {
    success: 'M20 6L9 17l-5-5',
    error: 'M18 6L6 18M6 6l12 12',
    warning: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
    info: 'M12 8h.01 M12 12v4',
  }
  return (
    <div className={`alert alert-${status.type}`} style={{ position: 'relative' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        {status.type === 'success' && <polyline points="20 6 9 17 4 12" />}
        {status.type === 'error' && <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
        {status.type === 'warning' && <><path d={icons.warning}/></>}
        {status.type === 'info' && <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>}
      </svg>
      <p style={{ flex: 1 }}>{status.message}</p>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'currentColor', opacity: 0.6, padding: '0.25rem', flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}

export default function AuctionRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [auction, setAuction] = useState<Auction | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [bidAmount, setBidAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<StatusType>(null)
  const [priceFlash, setPriceFlash] = useState(false)
  const { user } = useAuth()
  const realTimeBid = useAuctionSocket(id)

  const fetchAuction = useCallback(async () => {
    try {
      const [item, bidHistory] = await Promise.allSettled([
        auctionApi.getAuction(id),
        auctionApi.getBids(id),
      ])
      if (item.status === 'fulfilled') {
        setAuction(item.value)
      } else {
        setStatus({ type: 'error', message: 'Could not load auction details.' })
      }

      if (bidHistory.status === 'fulfilled') {
        const raw = bidHistory.value
        console.log('[AuctionX] getBids raw response:', raw)

        // Handle all Spring Boot response shapes:
        // 1. Plain array:          [{...}, {...}]
        // 2. Spring Page:          { content: [{...}], totalElements: N, ... }
        // 3. Wrapped:              { bids: [{...}] }
        // 4. Single object (edge): {...}
        let arr: Bid[] = []
        if (Array.isArray(raw)) {
          arr = raw
        } else if (raw && Array.isArray(raw.content)) {
          arr = raw.content          // Spring Page
        } else if (raw && Array.isArray(raw.bids)) {
          arr = raw.bids             // custom wrapper
        } else if (raw && typeof raw === 'object' && raw.id) {
          arr = [raw]                // single bid returned
        }

        setBids(arr.sort((a: Bid, b: Bid) =>
          toUTCMs(b.bidTime) - toUTCMs(a.bidTime)
        ))
      } else {
        // Log so we can see if it's a 404 or another error
        console.warn('[AuctionX] getBids failed:', (bidHistory as PromiseRejectedResult).reason)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAuction() }, [fetchAuction])

  useEffect(() => {
    if (!realTimeBid) return
    setAuction(prev => prev ? { ...prev, currentHighestBid: realTimeBid.bidAmount } : prev)
    setBids(prev => [realTimeBid, ...prev.slice(0, 49)])
    setPriceFlash(true)
    setTimeout(() => setPriceFlash(false), 800)
    if (realTimeBid.username !== user?.username) {
      setStatus({ type: 'info', message: `${realTimeBid.username} just placed a bid of $${realTimeBid.bidAmount.toLocaleString()}!` })
    }
  }, [realTimeBid, user?.username])

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setStatus({ type: 'warning', message: 'You must be logged in to place a bid.' }); return }
    if (!auction) return

    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount <= auction.currentHighestBid) {
      setStatus({ type: 'error', message: `Bid must be higher than the current highest bid of $${auction.currentHighestBid.toLocaleString()}.` })
      return
    }
    setSubmitting(true)
    setStatus({ type: 'info', message: 'Submitting your bid...' })
    try {
      await auctionApi.placeBid(parseInt(id), user.id, amount)
      setBidAmount("")
      await fetchAuction()
      setStatus({ type: 'success', message: `Bid of $${amount.toLocaleString()} placed! You are the current highest bidder.` })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Someone else')) {
        setStatus({ type: 'warning', message: '⚡ Optimistic lock conflict — someone else bid at the same moment. Refresh and try again.' })
      } else if (msg.includes('higher')) {
        setStatus({ type: 'error', message: 'Bid too low. Must be higher than the current price.' })
      } else {
        setStatus({ type: 'error', message: msg || 'Failed to place bid.' })
      }
      await fetchAuction()
    } finally {
      setSubmitting(false)
    }
  }

  const minBid = auction ? Math.ceil(auction.currentHighestBid * 1.01) : 0

  if (loading) return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid var(--bg-elevated)', borderTopColor: 'var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading auction...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!auction) return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: '1.1rem' }}>Auction not found</p>
        <Link href="/" className="btn-ghost" style={{ marginTop: '1.5rem' }}>Back to listings</Link>
      </div>
    </div>
  )

  const isActive = auction.status === 'ACTIVE'

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div className="container-app" style={{ paddingTop: 'clamp(2rem, 4vw, 3rem)' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            All Listings
          </Link>
        </div>

        {/* Title Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-amber">LOT #{String(id).padStart(3, '0')}</span>
              <span className={`badge ${isActive ? 'badge-active' : 'badge-ended'}`}>
                {isActive && <span className="live-dot" style={{ transform: 'scale(0.6)' }} />}
                {auction.status}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 'clamp(1.625rem, 4vw, 2.5rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {auction.title}
            </h1>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

          {/* LEFT: Info + Description + Countdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Current Price Hero */}
            <div className="glass-amber" style={{ borderRadius: '14px', padding: '2rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Current Highest Bid</p>
              <p className="mono" style={{
                fontSize: 'clamp(2.5rem, 6vw, 3.75rem)',
                fontWeight: 900,
                lineHeight: 1,
                transition: 'color 0.3s',
                color: priceFlash ? 'var(--amber)' : 'var(--text-primary)',
              }}>
                ${auction.currentHighestBid.toLocaleString()}
              </p>
              <div className="divider" style={{ margin: '1.25rem 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Starting Price</p>
                  <p className="mono" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>${auction.startingPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Bids</p>
                  <p className="mono" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{bids.length} recorded</p>
                </div>
              </div>
            </div>

            {/* Countdown */}
            {isActive && (
              <div className="glass" style={{ borderRadius: '14px', padding: '1.75rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Time Remaining</p>
                <Countdown endTime={auction.endTime} />
              </div>
            )}

            {/* Description */}
            <div className="glass" style={{ borderRadius: '14px', padding: '1.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Item Description</p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.95rem' }}>{auction.description}</p>
            </div>

            {/* Architecture Callout */}
            <div style={{ borderRadius: '12px', padding: '1.25rem 1.5rem', background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--blue-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Powered by Apache Kafka</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Every bid fires through the Kafka event bus. <strong style={{ color: 'var(--text-secondary)' }}>Optimistic locking</strong> at the database layer prevents race conditions — only <em>one</em> bid wins in concurrent scenarios.
              </p>
            </div>
          </div>

          {/* RIGHT: Bid Form + History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Bid Form */}
            {isActive ? (
              <div className="glass" style={{ borderRadius: '14px', padding: '2rem' }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                  Place Your Bid
                </h2>

                <StatusAlert status={status} onDismiss={() => setStatus(null)} />

                {!user && (
                  <div className="alert alert-warning" style={{ marginBottom: '1.25rem', marginTop: status ? '1rem' : 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <p>You must <Link href="/register" style={{ color: 'var(--amber)', fontWeight: 600 }}>register</Link> before bidding.</p>
                  </div>
                )}

                <form onSubmit={handlePlaceBid} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: status || !user ? '1.25rem' : 0 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Your Bid Amount
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span className="mono" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem' }}>$</span>
                      <input
                        type="number" className="input mono"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        placeholder={`${minBid.toFixed(2)}`}
                        min={minBid} step="0.01"
                        required
                        style={{ paddingLeft: '2rem', fontSize: '1.1rem', height: '56px' }}
                        disabled={!user || submitting}
                      />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                      Min. bid: <span className="mono" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>${minBid.toLocaleString()}</span>
                    </p>
                  </div>

                  {/* Quick bid increments */}
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.625rem', fontWeight: 500 }}>Quick increments above current bid:</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[10, 50, 100, 500].map(inc => (
                        <button
                          key={inc} type="button" disabled={!user}
                          onClick={() => setBidAmount((auction.currentHighestBid + inc).toFixed(2))}
                          className="btn-ghost" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                        >
                          +${inc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={!user || submitting} style={{ height: '52px', fontSize: '1rem' }}>
                    {submitting ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                          <path d="M21 12a9 9 0 11-6.219-8.56"/>
                        </svg>
                        Placing Bid...
                      </>
                    ) : `Place Bid ${bidAmount ? `· $${parseFloat(bidAmount || '0').toLocaleString()}` : ''}`}
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass" style={{ borderRadius: '14px', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔨</div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Auction Ended</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Final price: <span className="mono" style={{ color: 'var(--amber)', fontWeight: 700 }}>${auction.currentHighestBid.toLocaleString()}</span>
                </p>
              </div>
            )}

            {/* Bid History */}
            <div className="glass" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Live Bid Feed</h3>
                {isActive && <span className="badge badge-active"><span className="live-dot" style={{ transform: 'scale(0.6)' }} />Streaming</span>}
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {bids.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No bids captured yet. Be the first!
                  </div>
                ) : bids.map((bid, i) => (
                  <div key={bid.bidTime || i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--border)',
                    background: bid.username === user?.username ? 'var(--amber-dim)' : 'transparent',
                    transition: 'background 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        background: bid.username === user?.username ? 'var(--amber)' : 'var(--bg-elevated)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.75rem',
                        color: bid.username === user?.username ? '#000' : 'var(--text-secondary)',
                      }}>
                        {bid.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {bid.username}
                          {bid.username === user?.username && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--amber)', fontWeight: 700 }}>YOU</span>}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                          {new Date(bid.bidTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <p className="mono" style={{ fontWeight: 800, fontSize: '0.95rem', color: i === 0 ? 'var(--amber)' : 'var(--text-secondary)' }}>
                      ${bid.bidAmount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
