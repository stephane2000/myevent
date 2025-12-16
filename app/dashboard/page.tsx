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
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">MyEvent</span>
          </Link>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            Déconnexion
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white border border-purple-100 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(user?.user_metadata?.first_name?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenue <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {user?.user_metadata?.first_name || 'utilisateur'}
                </span>
                {isAdmin && <span className="text-orange-600"> (Admin)</span>}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-purple-100 pt-8">
            <p className="text-gray-700 mb-6">
              Votre espace personnel est en cours de développement. Bientôt vous pourrez :
            </p>

            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Gérer vos événements</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Rechercher des prestataires</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Suivre vos demandes</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
