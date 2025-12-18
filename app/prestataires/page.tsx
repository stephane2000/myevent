'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Prestataire {
  user_id: string
  first_name: string
  last_name: string
  company_name: string | null
  service_category: string | null
  city: string | null
  average_rating: number
  total_reviews: number
  total_services: number
}

export default function PrestatairesPage() {
  const [loading, setLoading] = useState(true)
  const [prestataires, setPrestataires] = useState<Prestataire[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isPrestataire, setIsPrestataire] = useState(false)

  const categories = [
    'Tous',
    'DJ / Musique',
    'Photographe',
    'Vidéaste',
    'Traiteur',
    'Décorateur',
    'Animateur',
    'Location de salle',
    'Location de matériel',
    'Wedding planner',
    'Fleuriste',
    'Autre'
  ]

  useEffect(() => {
    checkUserAndLoadPrestataires()
  }, [])

  async function checkUserAndLoadPrestataires() {
    // Vérifier l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      const { data: roleData } = await supabase.rpc('get_current_user_role')
      if (roleData && roleData.length > 0) {
        setIsPrestataire(roleData[0].role === 'prestataire')
      }
    }

    // Charger les prestataires
    await loadPrestataires()
  }

  async function loadPrestataires() {
    try {
      const { data, error } = await supabase.rpc('get_all_prestataires')

      if (error) throw error

      if (data) {
        setPrestataires(data)
      }
    } catch (error) {
      console.error('Erreur chargement prestataires:', error)
    } finally {
      setLoading(false)
    }
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < Math.round(rating) ? 'text-amber-400 fill-current' : 'text-neutral-300'}`}
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  const filteredPrestataires = prestataires.filter(p => {
    const matchesSearch =
      !searchQuery ||
      (p.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (`${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.service_category?.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      !selectedCategory ||
      selectedCategory === 'Tous' ||
      p.service_category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
          <span className="text-neutral-500">Chargement...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">Trouvez votre prestataire</h1>
          <p className="text-neutral-600 text-lg">Découvrez les meilleurs professionnels pour votre événement</p>
        </div>

        {/* Filtres */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-6 mb-8">
          <div className="space-y-4">
            {/* Recherche */}
            <div className="relative">
              <svg className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un prestataire, une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              />
            </div>

            {/* Catégories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === 'Tous' ? '' : cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    (selectedCategory === cat || (!selectedCategory && cat === 'Tous'))
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des prestataires */}
        {filteredPrestataires.length === 0 ? (
          <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Aucun prestataire trouvé</h3>
            <p className="text-neutral-500">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrestataires.map((prestataire) => {
              const fullName = `${prestataire.first_name} ${prestataire.last_name}`.trim()
              const displayName = fullName || prestataire.company_name || 'Prestataire'
              const showCompanyName = prestataire.company_name && fullName && prestataire.company_name !== fullName
              
              return (
              <div
                key={prestataire.user_id}
                className="bg-white border border-neutral-100 rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-xl flex items-center justify-center text-neutral-600 text-2xl font-semibold">
                    {(prestataire.first_name?.[0] || 'P').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900">
                      {displayName}
                    </h3>
                    {showCompanyName && (
                      <p className="text-sm text-neutral-600">{prestataire.company_name}</p>
                    )}
                    {prestataire.service_category && (
                      <p className="text-sm text-neutral-500">{prestataire.service_category}</p>
                    )}
                  </div>
                </div>

                {/* Localisation */}
                {prestataire.city && (
                  <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {prestataire.city}
                  </div>
                )}

                {/* Note et avis */}
                {prestataire.total_reviews > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-0.5">
                      {renderStars(prestataire.average_rating)}
                    </div>
                    <span className="text-sm font-medium text-neutral-900">
                      {prestataire.average_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-neutral-500">
                      ({prestataire.total_reviews} avis)
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 pb-4 border-t border-neutral-100 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-neutral-900">{prestataire.total_services}</p>
                    <p className="text-xs text-neutral-500">Services</p>
                  </div>
                  <div className="h-8 w-px bg-neutral-200"></div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-neutral-900">{prestataire.total_reviews}</p>
                    <p className="text-xs text-neutral-500">Avis</p>
                  </div>
                  <div className="h-8 w-px bg-neutral-200"></div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">✓</p>
                    <p className="text-xs text-neutral-500">Vérifié</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/prestataire/${prestataire.user_id}`}
                    className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all text-center"
                  >
                    Voir le profil
                  </Link>
                  {currentUserId && currentUserId !== prestataire.user_id && (
                    <Link
                      href={`/messages?prestataire=${prestataire.user_id}`}
                      className="px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-all flex items-center justify-center"
                      title="Contacter"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        )}

        {/* CTA - masqué pour les prestataires connectés */}
        {!isPrestataire && (
          <div className="mt-12 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Vous êtes prestataire ?</h2>
            <p className="text-neutral-300 mb-6">Rejoignez notre plateforme et développez votre activité</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-xl font-medium hover:bg-neutral-100 transition-all"
            >
              Créer un compte prestataire
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
