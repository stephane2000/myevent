'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function Parametres() {
  const [user, setUser] = useState<any>(null)
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

      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="bg-white border border-orange-100 rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Paramètres</h1>

          <div className="border-t border-orange-100 pt-8">
            <p className="text-gray-700 mb-6">
              La gestion de vos paramètres est en cours de développement. Bientôt vous pourrez :
            </p>

            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Modifier vos informations personnelles</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Gérer vos préférences de notification</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Configurer la sécurité de votre compte</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
