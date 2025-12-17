'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('client')
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

      // Récupérer le rôle et le statut admin via une fonction PostgreSQL
      // Ceci bypass RLS de manière sécurisée
      const { data: roleData, error } = await supabase
        .rpc('get_current_user_role')

      if (error) {
        console.error('Erreur lors de la récupération du rôle:', error)
      } else if (roleData && roleData.length > 0) {
        console.log('Role data récupéré:', roleData[0])
        setUserRole(roleData[0].role)
        setIsAdmin(roleData[0].is_admin || false)
      } else {
        console.log('Aucun role data trouvé pour user:', user.id)
      }
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
      <main className="max-w-7xl mx-auto px-6 py-24">
        {/* Header Section */}
        <div className="bg-white border border-orange-100 rounded-2xl p-8 shadow-xl mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {(user?.user_metadata?.first_name?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {user?.user_metadata?.first_name || 'Utilisateur'}
                </h1>
                <p className="text-gray-600 mb-3">{user?.email}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                    userRole === 'prestataire'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {userRole === 'prestataire' ? '🎯 Prestataire' : '👤 Client'}
                  </span>
                  {isAdmin && (
                    <span className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-sm font-semibold shadow-md">
                      ⭐ Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button className="px-6 py-3 bg-white border-2 border-orange-200 text-gray-700 rounded-xl font-semibold hover:bg-orange-50 transition-all">
              Modifier le profil
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {userRole === 'prestataire' ? (
            <>
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Services actifs</span>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl">
                    📋
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Annonces publiées</p>
              </div>
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Demandes reçues</span>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl">
                    📬
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Cette semaine</p>
              </div>
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Note moyenne</span>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl">
                    ⭐
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-500 mt-1">Pas encore d'avis</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Événements</span>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl">
                    🎉
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">En cours</p>
              </div>
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Demandes</span>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl">
                    📤
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Envoyées</p>
              </div>
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Favoris</span>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl">
                    ❤️
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Prestataires sauvegardés</p>
              </div>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Annonces Section */}
            <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {userRole === 'prestataire' ? 'Mes Services' : 'Mes Événements'}
                </h2>
                <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all shadow-md">
                  + Créer {userRole === 'prestataire' ? 'un service' : 'un événement'}
                </button>
              </div>

              {/* Empty State */}
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
                  {userRole === 'prestataire' ? '📋' : '🎉'}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {userRole === 'prestataire'
                    ? 'Aucun service publié'
                    : 'Aucun événement créé'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {userRole === 'prestataire'
                    ? 'Commencez par créer votre première annonce de service'
                    : 'Créez votre premier événement et trouvez des prestataires'}
                </p>
              </div>
            </div>

            {/* Activity Section */}
            <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Activité récente</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    🎯
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Compte créé avec succès</p>
                    <p className="text-sm text-gray-600">Bienvenue sur MyEvent!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Actions rapides</h2>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:border-orange-300 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <span className="font-semibold text-gray-900">Mes messages</span>
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:border-orange-300 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔍</span>
                    <span className="font-semibold text-gray-900">
                      {userRole === 'prestataire' ? 'Voir les demandes' : 'Trouver un prestataire'}
                    </span>
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:border-orange-300 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚙️</span>
                    <span className="font-semibold text-gray-900">Paramètres</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 shadow-lg text-white">
              <h2 className="text-xl font-bold mb-2">Complétez votre profil</h2>
              <p className="text-orange-100 text-sm mb-4">
                Un profil complet augmente vos chances de {userRole === 'prestataire' ? 'trouver des clients' : 'trouver le prestataire idéal'}
              </p>
              <div className="bg-white/20 rounded-full h-2 mb-2">
                <div className="bg-white rounded-full h-2 w-1/4"></div>
              </div>
              <p className="text-sm font-semibold">25% complété</p>
            </div>

            {/* Tips */}
            <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Conseil du jour</h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                {userRole === 'prestataire'
                  ? 'Ajoutez des photos de vos réalisations pour augmenter votre visibilité de 70%!'
                  : 'Définissez clairement votre budget et vos attentes pour recevoir des propositions pertinentes.'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
