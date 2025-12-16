'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
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
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-shadow">
                  {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
