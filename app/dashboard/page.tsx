'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)

      // Vérifier si l'utilisateur est admin dans la table admins
      const { data: adminData } = await supabase
        .from('admins')
        .select('is_admin')
        .eq('user_id', user.id)
        .single()

      setIsAdmin(adminData?.is_admin || false)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-xl text-slate-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg"></div>
            <span className="text-xl font-bold text-white tracking-tight">MyEvent</span>
          </Link>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Déconnexion
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(user?.user_metadata?.first_name?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Bienvenue {user?.user_metadata?.first_name || 'utilisateur'}
                {isAdmin && <span className="text-amber-500"> (Admin)</span>}
              </h1>
              <p className="text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-slate-800/50 pt-8">
            <p className="text-slate-300 mb-6">
              Votre espace personnel est en cours de développement. Bientôt vous pourrez :
            </p>

            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-slate-300">Gérer vos événements</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-slate-300">Rechercher des prestataires</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-slate-300">Suivre vos demandes</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
