'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface User {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  city: string | null
  role: string
  is_admin: boolean
  created_at: string
}

interface Stats {
  total_users: number
  total_clients: number
  total_prestataires: number
  total_admins: number
  users_this_week: number
}

interface Service {
  id: string
  title: string
  category: string
  price_min: number | null
  price_max: number | null
  is_active: boolean
  created_at: string
  user_id: string
  prestataire_name: string
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'users') {
        loadUsers()
      } else {
        loadServices()
      }
      loadStats()
    }
  }, [isAdmin, searchQuery, currentPage, activeTab])

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: roleData } = await supabase.rpc('get_current_user_role')
    
    if (!roleData || roleData.length === 0 || !roleData[0].is_admin) {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }

  async function loadStats() {
    const { data, error } = await supabase.rpc('admin_get_stats')
    if (!error && data && data.length > 0) {
      setStats(data[0])
    }
  }

  async function loadUsers() {
    const { data: countData } = await supabase.rpc('admin_count_users', {
      p_search: searchQuery || null
    })

    if (countData !== null) {
      setTotalUsers(countData)
    }

    const { data, error } = await supabase.rpc('admin_get_all_users', {
      p_search: searchQuery || null,
      p_limit: ITEMS_PER_PAGE,
      p_offset: currentPage * ITEMS_PER_PAGE
    })

    if (error) {
      console.error('Erreur chargement users:', error)
    } else if (data) {
      setUsers(data)
    }
  }

  async function loadServices() {
    try {
      const { data, error } = await supabase
        .from('prestataire_services')
        .select(`
          id,
          title,
          category,
          price_min,
          price_max,
          is_active,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Pour chaque service, récupérer le nom du prestataire
      if (data) {
        const servicesWithPrestataire = data.map((service: any) => ({
          ...service,
          prestataire_name: 'Prestataire' // Sera amélioré avec une fonction RPC
        }))
        setServices(servicesWithPrestataire)
      }
    } catch (error) {
      console.error('Erreur chargement services:', error)
    }
  }

  async function handleUpdateRole(userId: string, newRole: string) {
    setActionLoading(userId)
    setMessage(null)

    const { error } = await supabase.rpc('admin_update_user_role', {
      p_user_id: userId,
      p_role: newRole
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Rôle mis à jour' })
      loadUsers()
      loadStats()
    }

    setActionLoading(null)
  }

  async function handleToggleAdmin(userId: string, currentIsAdmin: boolean) {
    setActionLoading(userId)
    setMessage(null)

    const { error } = await supabase.rpc('admin_update_user_role', {
      p_user_id: userId,
      p_is_admin: !currentIsAdmin
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: currentIsAdmin ? 'Droits admin retirés' : 'Droits admin accordés' })
      loadUsers()
      loadStats()
    }

    setActionLoading(null)
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${email} ? Cette action est irréversible.`)) {
      return
    }

    setActionLoading(userId)
    setMessage(null)

    const { error } = await supabase.rpc('admin_delete_user', {
      p_user_id: userId
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Utilisateur supprimé' })
      loadUsers()
      loadStats()
    }

    setActionLoading(null)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin"></div>
          <span className="text-neutral-500">Vérification des accès...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">Administration</h1>
          </div>
          <p className="text-neutral-500">Gérez les utilisateurs et les annonces de la plateforme</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white border border-neutral-100 rounded-2xl p-5">
              <p className="text-sm text-neutral-500 mb-1">Total utilisateurs</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.total_users}</p>
            </div>
            <div className="bg-white border border-neutral-100 rounded-2xl p-5">
              <p className="text-sm text-neutral-500 mb-1">Clients</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total_clients}</p>
            </div>
            <div className="bg-white border border-neutral-100 rounded-2xl p-5">
              <p className="text-sm text-neutral-500 mb-1">Prestataires</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.total_prestataires}</p>
            </div>
            <div className="bg-white border border-neutral-100 rounded-2xl p-5">
              <p className="text-sm text-neutral-500 mb-1">Admins</p>
              <p className="text-2xl font-bold text-violet-600">{stats.total_admins}</p>
            </div>
            <div className="bg-white border border-neutral-100 rounded-2xl p-5">
              <p className="text-sm text-neutral-500 mb-1">Cette semaine</p>
              <p className="text-2xl font-bold text-amber-600">+{stats.users_this_week}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'listings'
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Annonces & Prestataires
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-neutral-100">
              <div className="relative">
                <svg className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou ville..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(0)
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Utilisateur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Admin</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Inscrit le</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 font-semibold text-sm">
                            {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 text-sm">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-neutral-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-neutral-600">{user.phone || '—'}</p>
                        <p className="text-xs text-neutral-400">{user.city || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.user_id, e.target.value)}
                          disabled={actionLoading === user.user_id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-violet-500 ${
                            user.role === 'prestataire'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <option value="client">Client</option>
                          <option value="prestataire">Prestataire</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleAdmin(user.user_id, user.is_admin)}
                          disabled={actionLoading === user.user_id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            user.is_admin
                              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                          }`}
                        >
                          {user.is_admin ? '✓ Admin' : 'Non'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.user_id, user.email)}
                          disabled={actionLoading === user.user_id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          {actionLoading === user.user_id ? (
                            <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
                <p className="text-sm text-neutral-500">
                  {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} au total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <span className="px-3 py-1.5 text-sm text-neutral-600">
                    Page {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}

            {users.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-neutral-500">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Catégorie</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Prix</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {services.map((service: Service) => (
                    <tr key={service.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-neutral-900">{service.title}</div>
                        <div className="text-xs text-neutral-500">{service.prestataire_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-lg">
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {service.price_min && service.price_max
                          ? `${service.price_min}€ - ${service.price_max}€`
                          : service.price_min
                          ? `${service.price_min}€`
                          : 'Sur devis'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                          service.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {service.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {new Date(service.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="text-sm text-violet-600 hover:text-violet-800 font-medium"
                          onClick={() => router.push(`/prestataire/${service.user_id}`)}
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {services.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-neutral-500">Aucun service trouvé</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
