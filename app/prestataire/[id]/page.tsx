'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface PrestataireProfile {
  user_id: string
  first_name: string
  last_name: string
  email: string
  company_name: string | null
  service_category: string | null
  description: string | null
  phone: string | null
  city: string | null
}

interface Service {
  id: string
  title: string
  description: string
  category: string
  price_type: string
  price_min: number | null
  price_max: number | null
  images: string[] | null
  view_count: number
}

interface Review {
  id: string
  client_name: string
  rating: number
  title: string | null
  comment: string | null
  response_from_prestataire: string | null
  created_at: string
}

interface Stats {
  total_services: number
  total_bookings: number
  total_reviews: number
  average_rating: number
}

export default function PrestatairePublicProfile() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<PrestataireProfile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<'services' | 'reviews'>('services')
  
  // États pour le formulaire d'avis
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [userReview, setUserReview] = useState<Review | null>(null)

  useEffect(() => {
    loadCurrentUser()
    loadPrestataireData()
  }, [params.id])

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      // Vérifier si l'utilisateur a déjà laissé un avis
      checkUserReview(user.id)
    }
  }

  async function checkUserReview(userId: string) {
    const prestataireId = params.id as string
    const { data } = await supabase
      .from('prestataire_reviews')
      .select('*')
      .eq('prestataire_id', prestataireId)
      .eq('client_id', userId)
      .single()
    
    if (data) {
      setHasReviewed(true)
      setUserReview(data)
      setReviewRating(data.rating)
      setReviewTitle(data.title || '')
      setReviewComment(data.comment || '')
    }
  }

  async function loadPrestataireData() {
    const prestataireId = params.id as string

    // Utiliser la fonction RPC get_all_prestataires pour récupérer les infos
    const { data: prestatairesData } = await supabase.rpc('get_all_prestataires')
    const prestataireInfo = prestatairesData?.find((p: any) => p.user_id === prestataireId)

    if (!prestataireInfo) {
      setLoading(false)
      return
    }

    // Charger user_settings pour plus de détails
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('phone, city')
      .eq('user_id', prestataireId)
      .single()

    setProfile({
      user_id: prestataireId,
      first_name: prestataireInfo.first_name || '',
      last_name: prestataireInfo.last_name || '',
      email: '',
      company_name: prestataireInfo.company_name || null,
      service_category: prestataireInfo.service_category || null,
      description: null,
      phone: settingsData?.phone || null,
      city: prestataireInfo.city || settingsData?.city || null
    })

    // Charger les services
    const { data: servicesData } = await supabase
      .from('prestataire_services')
      .select('id, title, description, category, price_type, price_min, price_max, images, view_count')
      .eq('user_id', prestataireId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (servicesData) setServices(servicesData)

    // Charger les avis directement depuis la table
    await loadReviews(prestataireId)

    // Charger les statistiques
    const { data: statsData } = await supabase
      .from('prestataire_stats')
      .select('*')
      .eq('user_id', prestataireId)
      .single()

    if (statsData) {
      setStats(statsData)
    } else {
      setStats({
        total_services: prestataireInfo.total_services || 0,
        total_bookings: 0,
        total_reviews: prestataireInfo.total_reviews || 0,
        average_rating: prestataireInfo.average_rating || 0
      })
    }

    setLoading(false)
  }

  async function loadReviews(prestataireId: string) {
    const { data: reviewsData, error } = await supabase
      .rpc('get_prestataire_reviews', {
        p_user_id: prestataireId,
        p_limit: 50,
        p_offset: 0
      })

    if (!error && reviewsData) {
      setReviews(reviewsData)
    } else {
      // Fallback: charger directement depuis la table
      const { data } = await supabase
        .from('prestataire_reviews')
        .select('*')
        .eq('prestataire_id', prestataireId)
        .order('created_at', { ascending: false })
      
      if (data) setReviews(data)
    }
  }

  async function submitReview() {
    if (!currentUserId || !profile) return
    
    setSubmittingReview(true)
    
    try {
      // Utiliser le RPC si disponible, sinon insertion directe
      const { data, error } = await supabase
        .rpc('add_review', {
          p_prestataire_id: profile.user_id,
          p_rating: reviewRating,
          p_title: reviewTitle || null,
          p_comment: reviewComment || null
        })

      if (error) {
        // Fallback: insertion directe
        const { error: insertError } = await supabase
          .from('prestataire_reviews')
          .upsert({
            prestataire_id: profile.user_id,
            client_id: currentUserId,
            rating: reviewRating,
            title: reviewTitle || null,
            comment: reviewComment || null
          }, {
            onConflict: 'prestataire_id,client_id'
          })
        
        if (insertError) throw insertError
      }

      // Recharger les avis et stats
      await loadReviews(profile.user_id)
      await loadPrestataireData()
      
      setShowReviewForm(false)
      setHasReviewed(true)
      
    } catch (error) {
      console.error('Erreur soumission avis:', error)
      alert('Erreur lors de la soumission de l\'avis')
    } finally {
      setSubmittingReview(false)
    }
  }

  function formatPrice(service: Service) {
    if (service.price_type === 'on_request') return 'Sur devis'
    if (!service.price_min) return 'Non défini'

    const min = service.price_min.toLocaleString('fr-FR')
    const max = service.price_max ? ` - ${service.price_max.toLocaleString('fr-FR')}` : ''

    const typeLabel = {
      fixed: '',
      hourly: '/h',
      daily: '/jour',
      package: ' (forfait)'
    }[service.price_type] || ''

    return `${min}${max}€${typeLabel}`
  }

  function renderStars(rating: number, size: 'sm' | 'md' | 'lg' = 'md') {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`${sizeClass} ${i < Math.round(rating) ? 'text-amber-400 fill-current' : 'text-neutral-300'}`}
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  function renderClickableStars() {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setReviewRating(i + 1)}
        className="focus:outline-none"
      >
        <svg
          className={`w-8 h-8 transition-colors ${i < reviewRating ? 'text-amber-400 fill-current' : 'text-neutral-300 hover:text-amber-200'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    ))
  }

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

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Prestataire non trouvé</h2>
            <p className="text-neutral-500 mb-6">Ce profil n'existe pas ou n'est plus disponible.</p>
            <Link href="/prestataires" className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all">
              Voir tous les prestataires
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const displayName = `${profile.first_name} ${profile.last_name}`.trim() || 'Prestataire'

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-24">
        {/* Header Profile */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-8 mb-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-2xl flex items-center justify-center text-neutral-600 text-3xl font-semibold flex-shrink-0">
              {profile.first_name?.[0]?.toUpperCase() || 'P'}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                {displayName}
              </h1>

              {profile.service_category && (
                <p className="text-neutral-600 mb-3">{profile.service_category}</p>
              )}

              {/* Rating Stars */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-0.5">
                  {renderStars(stats?.average_rating || 0, 'lg')}
                </div>
                <span className="text-xl font-bold text-neutral-900">
                  {(stats?.average_rating || 0).toFixed(1)}
                </span>
                <span className="text-neutral-500">
                  ({stats?.total_reviews || 0} avis)
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                {profile.city && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profile.city}
                  </div>
                )}
                {stats && stats.average_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {stats.average_rating.toFixed(1)} ({stats.total_reviews} avis)
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards & Contact */}
            <div className="flex flex-col gap-4">
              {stats && (
                <div className="flex gap-4">
                  <div className="bg-neutral-50 rounded-xl p-4 text-center min-w-[100px]">
                    <p className="text-2xl font-bold text-neutral-900">{stats.total_services}</p>
                    <p className="text-xs text-neutral-500">Services</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4 text-center min-w-[100px]">
                    <p className="text-2xl font-bold text-neutral-900">{stats.total_bookings}</p>
                    <p className="text-xs text-neutral-500">Prestations</p>
                  </div>
                </div>
              )}
              
              {/* Contact Button */}
              {currentUserId && currentUserId !== profile.user_id && (
                <Link
                  href={`/messages?prestataire=${profile.user_id}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contacter
                </Link>
              )}
              {!currentUserId && (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Connectez-vous pour contacter
                </Link>
              )}

              {/* Review Button */}
              {currentUserId && currentUserId !== profile.user_id && !hasReviewed && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Laisser un avis
                </button>
              )}
              {currentUserId && currentUserId !== profile.user_id && hasReviewed && (
                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-xl font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Vous avez déjà laissé un avis
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-900">Laisser un avis</h2>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={submitReview} className="space-y-5">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Note *
                  </label>
                  <div className="flex gap-1">
                    {renderClickableStars()}
                  </div>
                  {reviewRating === 0 && (
                    <p className="text-xs text-neutral-500 mt-1">Cliquez sur les étoiles pour noter</p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Titre de l'avis
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Résumez votre expérience..."
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    maxLength={100}
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Votre avis *
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Décrivez votre expérience avec ce prestataire..."
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all resize-none"
                    required
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 px-4 py-3 border border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview || reviewRating === 0}
                    className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Envoi...
                      </span>
                    ) : (
                      'Publier mon avis'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'services'
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'reviews'
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Avis ({reviews.length})
          </button>
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                <div className="h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 relative">
                  {service.images && service.images.length > 0 ? (
                    <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-2">{service.title}</h3>
                  <p className="text-sm text-neutral-500 mb-3">{service.category}</p>
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{service.description}</p>

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-900">{formatPrice(service)}</p>
                    <Link
                      href={`/services/${service.id}`}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-all"
                    >
                      Voir détails
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {services.length === 0 && (
              <div className="col-span-full bg-white border border-neutral-100 rounded-2xl p-12 text-center">
                <p className="text-neutral-500">Aucun service disponible</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Add review button in tab */}
            {currentUserId && currentUserId !== profile.user_id && !hasReviewed && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Vous avez fait appel à ce prestataire ?</h3>
                  <p className="text-sm text-neutral-600">Partagez votre expérience avec la communauté !</p>
                </div>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Écrire un avis
                </button>
              </div>
            )}

            {/* Reviews list */}
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-neutral-100 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-neutral-900">{review.client_name || 'Client'}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm font-medium text-neutral-700">{review.rating}/5</span>
                  </div>
                </div>

                {review.title && (
                  <h3 className="font-semibold text-neutral-900 mb-2">{review.title}</h3>
                )}

                {review.comment && (
                  <p className="text-neutral-600 mb-4">{review.comment}</p>
                )}

                {review.response_from_prestataire && (
                  <div className="bg-neutral-50 rounded-xl p-4 border-l-4 border-neutral-900">
                    <p className="text-xs font-semibold text-neutral-900 mb-1">Réponse du prestataire</p>
                    <p className="text-sm text-neutral-700">{review.response_from_prestataire}</p>
                  </div>
                )}
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Aucun avis pour le moment</h3>
                <p className="text-neutral-500 mb-4">Soyez le premier à partager votre expérience !</p>
                {currentUserId && currentUserId !== profile.user_id && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Écrire le premier avis
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
