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
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<'services' | 'reviews'>('services')

  useEffect(() => {
    loadPrestataireData()
  }, [params.id])

  async function loadPrestataireData() {
    const userId = params.id as string

    // Charger le profil
    const { data: userData } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        auth.users (
          email,
          raw_user_meta_data
        )
      `)
      .eq('user_id', userId)
      .eq('role', 'prestataire')
      .single()

    if (!userData) {
      router.push('/dashboard')
      return
    }

    // Charger user_settings
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('phone, city')
      .eq('user_id', userId)
      .single()

    const userMeta = (userData as any).users?.raw_user_meta_data || {}

    setProfile({
      user_id: userId,
      first_name: userMeta.first_name || '',
      last_name: userMeta.last_name || '',
      email: (userData as any).users?.email || '',
      company_name: userMeta.company_name || null,
      service_category: userMeta.service_category || null,
      description: userMeta.description || null,
      phone: settingsData?.phone || null,
      city: settingsData?.city || null
    })

    // Charger les services
    const { data: servicesData } = await supabase
      .from('prestataire_services')
      .select('id, title, description, category, price_type, price_min, price_max, images, view_count')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (servicesData) setServices(servicesData)

    // Charger les avis
    const { data: reviewsData } = await supabase
      .rpc('get_prestataire_reviews', {
        p_user_id: userId,
        p_limit: 10,
        p_offset: 0
      })

    if (reviewsData) setReviews(reviewsData)

    // Charger les statistiques
    const { data: statsData } = await supabase
      .from('prestataire_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsData) setStats(statsData)

    setLoading(false)
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

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-amber-400 fill-current' : 'text-neutral-300'}`}
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
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

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-24">
        {/* Header Profile */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-2xl flex items-center justify-center text-neutral-600 text-3xl font-semibold flex-shrink-0">
              {profile.first_name?.[0]?.toUpperCase() || 'P'}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                {profile.company_name || `${profile.first_name} ${profile.last_name}`}
              </h1>

              {profile.service_category && (
                <p className="text-neutral-600 mb-3">{profile.service_category}</p>
              )}

              {profile.description && (
                <p className="text-neutral-600 mb-4">{profile.description}</p>
              )}

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

            {/* Stats Cards */}
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
          </div>
        </div>

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
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-neutral-100 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-neutral-900">{review.client_name}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {renderStars(review.rating)}
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
                <p className="text-neutral-500">Aucun avis pour le moment</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
