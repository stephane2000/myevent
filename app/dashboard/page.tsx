'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin"></div>
          <span className="text-neutral-500">Chargement...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-24">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl border border-neutral-200/60 rounded-3xl p-8 shadow-apple mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-2xl flex items-center justify-center text-neutral-600 text-3xl font-semibold">
                {(user?.user_metadata?.first_name?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-neutral-900 mb-1">
                  {user?.user_metadata?.first_name || 'Utilisateur'}
                </h1>
                <p className="text-neutral-500 text-sm mb-3">{user?.email}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    userRole === 'prestataire'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    {userRole === 'prestataire' ? 'Prestataire' : 'Client'}
                  </span>
                  {isAdmin && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all">
              Modifier le profil
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {userRole === 'prestataire' ? (
            <>
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-500 text-sm font-medium">Services actifs</span>
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-neutral-900">0</p>
                <p className="text-xs text-neutral-400 mt-1">Annonces publiées</p>
              </div>
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-500 text-sm font-medium">Demandes</span>
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-neutral-900">0</p>
                <p className="text-xs text-neutral-400 mt-1">Cette semaine</p>
              </div>
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-500 text-sm font-medium">Note moyenne</span>
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-neutral-900">—</p>
                <p className="text-xs text-neutral-400 mt-1">Pas encore d'avis</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-500 text-sm font-medium">Événements</span>
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-neutral-900">0</p>
                <p className="text-xs text-neutral-400 mt-1">En cours</p>
              </div>
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-500 text-sm font-medium">Demandes</span>
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-neutral-900">0</p>
                <p className="text-xs text-neutral-400 mt-1">Envoyées</p>
              </div>
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-neutral-500 text-sm font-medium">Favoris</span>
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-neutral-900">0</p>
                <p className="text-xs text-neutral-400 mt-1">Prestataires sauvegardés</p>
              </div>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Annonces Section */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">
                  {userRole === 'prestataire' ? 'Mes Services' : 'Mes Événements'}
                </h2>
                <button className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all">
                  + Créer
                </button>
              </div>

              {/* Empty State */}
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {userRole === 'prestataire'
                    ? 'Aucun service publié'
                    : 'Aucun événement créé'}
                </h3>
                <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                  {userRole === 'prestataire'
                    ? 'Créez votre première annonce de service'
                    : 'Créez votre premier événement'}
                </p>
              </div>
            </div>

            {/* Activity Section */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Activité récente</h2>

              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">Compte créé avec succès</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Bienvenue sur MyEvent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Actions rapides</h2>
              <div className="space-y-2">
                <Link href="/messages" className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-all group">
                  <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
                    <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-neutral-700">Messages</span>
                </Link>
                <Link href="/prestataires" className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-all group">
                  <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
                    <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-neutral-700">
                    {userRole === 'prestataire' ? 'Annonces' : 'Trouver un prestataire'}
                  </span>
                </Link>
                <Link href="/parametres" className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-all group">
                  <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
                    <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-neutral-700">Paramètres</span>
                </Link>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="bg-neutral-900 rounded-2xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Complétez votre profil</h2>
              <p className="text-neutral-400 text-sm mb-4">
                Un profil complet augmente vos chances de succès
              </p>
              <div className="bg-white/10 rounded-full h-1.5 mb-2">
                <div className="bg-white rounded-full h-1.5 w-1/4"></div>
              </div>
              <p className="text-xs text-neutral-400">25% complété</p>
            </div>

            {/* Tips */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">💡 Conseil</h2>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {userRole === 'prestataire'
                  ? 'Ajoutez des photos de vos réalisations pour augmenter votre visibilité.'
                  : 'Définissez clairement votre budget pour recevoir des propositions pertinentes.'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
