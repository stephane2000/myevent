'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setDropdownOpen(false)
    router.push('/')
  }

  if (loading) {
    return (
      <header className="fixed top-0 w-full z-50 glass border-b border-black/[0.04]">
        <nav className="max-w-6xl mx-auto px-6 py-4">
          <div className="h-8"></div>
        </nav>
      </header>
    )
  }

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-black/[0.04]">
      <nav className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-neutral-900 to-neutral-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="text-lg font-semibold text-neutral-900 tracking-tight">MyEvent</span>
          </Link>

          {/* Navigation centrée */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.03] rounded-lg transition-all">
              Accueil
            </Link>
            <Link href="/prestataires" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.03] rounded-lg transition-all">
              Prestataires
            </Link>
            <Link href="/annonces" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.03] rounded-lg transition-all">
              Annonces
            </Link>
          </div>

          {/* Navigation pour utilisateur non connecté */}
          {!user && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 text-sm font-medium bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all"
              >
                S'inscrire
              </Link>
            </div>
          )}

          {/* Navigation pour utilisateur connecté */}
          {user && (
            <div className="flex items-center gap-3">
              <Link
                href="/messages"
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.03] rounded-lg transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
              </Link>

              {/* Menu déroulant profil */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-full flex items-center justify-center text-neutral-700 font-semibold text-sm hover:from-neutral-300 hover:to-neutral-400 transition-all cursor-pointer ring-2 ring-white">
                    {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass rounded-2xl shadow-apple-lg border border-black/[0.04] py-1.5 z-50">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 hover:bg-black/[0.03] transition-colors mx-1.5 rounded-lg"
                    >
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium">Mon profil</span>
                    </Link>

                    <Link
                      href="/parametres"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 hover:bg-black/[0.03] transition-colors mx-1.5 rounded-lg"
                    >
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">Paramètres</span>
                    </Link>

                    <div className="border-t border-black/[0.06] my-1.5 mx-3"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors w-full text-left mx-1.5 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm font-medium">Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
