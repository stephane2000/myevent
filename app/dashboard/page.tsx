'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white flex items-center justify-center">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="bg-white border border-orange-100 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(user?.user_metadata?.first_name?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenue {user?.user_metadata?.first_name || 'utilisateur'}
                {isAdmin && <span className="text-orange-600"> (Admin)</span>}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-orange-100 pt-8">
            <p className="text-gray-700 mb-6">
              Votre espace personnel est en cours de développement. Bientôt vous pourrez :
            </p>

            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Gérer vos événements</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Rechercher des prestataires</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
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
