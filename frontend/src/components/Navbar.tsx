"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function Navbar() {
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  const navLinks = [
    { href: '/', label: 'Auctions' },
    { href: '/create', label: 'Create Listing' },
  ]

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: 'all 0.3s ease',
          background: scrolled ? 'rgba(3,7,18,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <div className="container-app" style={{ height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L11 9"/>
                <path d="M5 7l4 4"/>
                <path d="m21 3-9 9"/>
                <path d="M21 3H15"/>
                <path d="M21 3V9"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Auction<span style={{ color: 'var(--amber)' }}>X</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden-mobile">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} style={{
                padding: '0.5rem 1rem', borderRadius: '7px', textDecoration: 'none',
                fontWeight: 500, fontSize: '0.9rem', transition: 'all 0.15s',
                color: pathname === link.href ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: pathname === link.href ? 'rgba(255,255,255,0.06)' : 'transparent',
              }}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="hidden-mobile" style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.5rem 0.875rem', borderRadius: '8px',
                  background: 'var(--amber-dim)', border: '1px solid var(--border-amber)',
                }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.75rem', color: '#000' }}>
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>{user.username}</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>ID #{user.id}</p>
                  </div>
                </div>
                <button onClick={logout} className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link href="/login" className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  Login
                </Link>
                <Link href="/register" className="btn-primary">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="show-mobile"
              onClick={() => setMobileOpen(v => !v)}
              style={{ background: 'none', border: '1px solid var(--border-strong)', borderRadius: '7px', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileOpen && (
          <div style={{
            background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} style={{
                  padding: '0.875rem 1rem', borderRadius: '8px', textDecoration: 'none',
                  fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-primary)',
                  background: pathname === link.href ? 'rgba(245,158,11,0.1)' : 'transparent',
                  border: pathname === link.href ? '1px solid var(--border-amber)' : '1px solid transparent',
                }}>
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID #{user.id} · {user.email}</p>
                  </div>
                  <button onClick={logout} className="btn-ghost" style={{ width: '100%' }}>Logout</button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Link href="/login" className="btn-ghost" style={{ width: '100%', textAlign: 'center' }}>
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary" style={{ width: '100%' }}>
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}
