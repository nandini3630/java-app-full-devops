"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { auctionApi } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

const PRESETS = [
  { label: "1 hour", hours: 1 },
  { label: "6 hours", hours: 6 },
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "1 week", hours: 168 },
]

function getEndTime(hours: number) {
  const d = new Date(Date.now() + hours * 3600000)
  // Format for datetime-local: YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatToISO(local: string) {
  return new Date(local).toISOString().replace('Z', '')
}

export default function CreateAuction() {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startingPrice, setStartingPrice] = useState("")
  const [endTime, setEndTime] = useState(getEndTime(24))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const allFilled = title.length >= 3 && description.length >= 10 && Number(startingPrice) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allFilled) return
    setError("")
    setLoading(true)
    try {
      const created = await auctionApi.createAuction({
        title,
        description,
        startingPrice: parseFloat(startingPrice),
        endTime: formatToISO(endTime),
      })
      router.push(`/auction/${created.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create auction.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div className="container-app" style={{ paddingTop: 'clamp(2rem, 5vw, 3.5rem)' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500, marginBottom: '1.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to Auctions
          </Link>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.625rem' }}>
            Create New Listing
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Once published, your item goes live on the Kafka auction bus instantly.</p>
        </div>

        {!user && (
          <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p style={{ fontWeight: 600 }}>You are not logged in</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>The auction will be created in the system. <Link href="/register" style={{ color: 'var(--amber)', fontWeight: 600 }}>Register an account</Link> to track your listings.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem' }}>

            {/* Main Form */}
            <div style={{ gridColumn: 'span 12' }} className="form-main">
              <div className="glass" style={{ borderRadius: '14px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                {error && (
                  <div className="alert alert-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>{error}</p>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Item Title <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    type="text" className="input" value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Vintage Rolex Submariner 1970"
                    required minLength={3} maxLength={100}
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{title.length}/100 characters</p>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Description <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <textarea
                    className="input" value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the item's condition, provenance, and any notable features..."
                    required minLength={10} rows={5}
                    style={{ resize: 'vertical', lineHeight: 1.6 }}
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{description.length} characters (min. 10)</p>
                </div>

                {/* Price + Time Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Starting Price (USD) <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>$</span>
                      <input
                        type="number" className="input mono" value={startingPrice}
                        onChange={e => setStartingPrice(e.target.value)}
                        placeholder="0.00" required min="0.01" step="0.01"
                        style={{ paddingLeft: '2rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Auction Ends At <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="datetime-local" className="input mono" value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      min={new Date(Date.now() + 60000).toISOString().slice(0,16)}
                      required
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Quick Duration Presets */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Quick Duration Presets
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                    {PRESETS.map(p => (
                      <button
                        key={p.hours} type="button"
                        onClick={() => setEndTime(getEndTime(p.hours))}
                        style={{
                          padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-strong)',
                          background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif", fontWeight: 500, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--amber)'; (e.target as HTMLButtonElement).style.color = 'var(--amber)'; }}
                        onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--border-strong)'; (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '10px', padding: '1.25rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pre-publish checklist</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { done: title.length >= 3, label: 'Title is at least 3 characters' },
                      { done: description.length >= 10, label: 'Description is at least 10 characters' },
                      { done: Number(startingPrice) > 0, label: 'Starting price is greater than $0' },
                      { done: new Date(endTime) > new Date(), label: 'End time is in the future' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                          background: item.done ? 'var(--emerald)' : 'var(--bg-surface)',
                          border: `1px solid ${item.done ? 'var(--emerald)' : 'var(--border-strong)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        }}>
                          {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span style={{ fontSize: '0.82rem', color: item.done ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit" className="btn-primary" disabled={loading || !allFilled}
                  style={{ height: '52px', fontSize: '1rem', alignSelf: 'flex-start', paddingLeft: '2rem', paddingRight: '2rem' }}
                >
                  {loading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/>
                      </svg>
                      Publish Listing
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
