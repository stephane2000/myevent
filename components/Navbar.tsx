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
      <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 py-5">
          <div className="h-8"></div>
        </nav>
      </header>
    )
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">MyEvent</span>
          </Link>

          {/* Navigation centrée */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-base font-medium text-gray-700 hover:text-orange-600 transition-colors">
              Accueil
            </Link>
            <Link href="/prestataires" className="text-base font-medium text-gray-700 hover:text-orange-600 transition-colors">
              Trouver un prestataire
            </Link>
            <Link href="/annonces" className="text-base font-medium text-gray-700 hover:text-orange-600 transition-colors">
              Annonces
            </Link>
          </div>

          {/* Navigation pour utilisateur non connecté */}
          {!user && (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 text-base text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-6 py-2.5 text-base bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/25 font-medium"
              >
                Créer un compte
              </Link>
            </div>
          )}

          {/* Navigation pour utilisateur connecté */}
          {user && (
            <div className="flex items-center gap-3">
              <Link
                href="/messages"
                className="px-5 py-2.5 text-base bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/25 font-medium"
              >
                Mes messages
              </Link>

              {/* Menu déroulant profil */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                    {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-orange-100 py-2 z-50">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">Mon profil</span>
                    </Link>

                    <Link
                      href="/parametres"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Paramètres</span>
                    </Link>

                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Déconnexion</span>
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
