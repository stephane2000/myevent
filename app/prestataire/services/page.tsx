'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Service {
  id: string
  title: string
  description: string
  category: string
  price_type: string
  price_min: number | null
  price_max: number | null
  images: string[] | null
  is_active: boolean
  view_count: number
  created_at: string
}

export default function PrestataireServicesPage() {
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [isPrestataire, setIsPrestataire] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: roleData } = await supabase.rpc('get_current_user_role')

    if (!roleData || roleData.length === 0 || roleData[0].role !== 'prestataire') {
      router.push('/dashboard')
      return
    }

    setIsPrestataire(true)
    await loadServices()
    setLoading(false)
  }

  async function loadServices() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('prestataire_services')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement services:', error)
    } else if (data) {
      setServices(data)
    }
  }

  async function toggleServiceStatus(serviceId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('prestataire_services')
      .update({ is_active: !currentStatus })
      .eq('id', serviceId)

    if (!error) {
      loadServices()
    }
  }

  async function deleteService(serviceId: string, title: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le service "${title}" ?`)) {
      return
    }

    const { error } = await supabase
      .from('prestataire_services')
      .delete()
      .eq('id', serviceId)

    if (error) {
      alert('Erreur lors de la suppression')
    } else {
      loadServices()
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

  if (!isPrestataire) return null

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Mes Services</h1>
            <p className="text-neutral-500">Gérez vos prestations et tarifs</p>
          </div>
          <Link
            href="/prestataire/services/nouveau"
            className="px-5 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer un service
          </Link>
        </div>

        {/* Services List */}
        {services.length === 0 ? (
          <div className="bg-white border border-neutral-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Aucun service</h3>
            <p className="text-neutral-500 mb-6">Créez votre premier service pour commencer à recevoir des demandes</p>
            <Link
              href="/prestataire/services/nouveau"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer mon premier service
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                {/* Image */}
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

                  {/* Badge statut */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {service.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-2">{service.title}</h3>
                      <p className="text-sm text-neutral-500">{service.category}</p>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{service.description}</p>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Prix</p>
                      <p className="text-sm font-semibold text-neutral-900">{formatPrice(service)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500 mb-1">Vues</p>
                      <p className="text-sm font-semibold text-neutral-900">{service.view_count}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/prestataire/services/modifier/${service.id}`}
                      className="flex-1 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-all text-center"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => toggleServiceStatus(service.id, service.is_active)}
                      className="px-3 py-2 border border-neutral-200 text-neutral-600 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-all"
                      title={service.is_active ? 'Désactiver' : 'Activer'}
                    >
                      {service.is_active ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => deleteService(service.id, service.title)}
                      className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
                      title="Supprimer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
