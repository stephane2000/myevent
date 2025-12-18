'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function ModifierServicePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priceType, setPriceType] = useState('fixed')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [locationType, setLocationType] = useState('on_site')
  const [serviceArea, setServiceArea] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [durationMax, setDurationMax] = useState('')
  const [capacity, setCapacity] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const router = useRouter()
  const params = useParams()
  const serviceId = params?.id as string

  const categories = [
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
    loadService()
  }, [serviceId])

  async function loadService() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('prestataire_services')
        .select('*')
        .eq('id', serviceId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setTitle(data.title || '')
        setDescription(data.description || '')
        setCategory(data.category || '')
        setPriceType(data.price_type || 'fixed')
        setPriceMin(data.price_min?.toString() || '')
        setPriceMax(data.price_max?.toString() || '')
        setLocationType(data.location_type || 'on_site')
        setServiceArea(data.service_area?.join(', ') || '')
        setDurationMin(data.duration_min?.toString() || '')
        setDurationMax(data.duration_max?.toString() || '')
        setCapacity(data.capacity?.toString() || '')
        setTags(data.tags?.join(', ') || '')
        setImages(data.images || [])
      }
    } catch (error: any) {
      alert('Erreur: ' + error.message)
      router.push('/prestataire/services')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const serviceData = {
        title,
        description,
        category,
        price_type: priceType,
        price_min: priceMin ? parseFloat(priceMin) : null,
        price_max: priceMax ? parseFloat(priceMax) : null,
        location_type: locationType,
        service_area: serviceArea ? serviceArea.split(',').map(s => s.trim()) : [],
        duration_min: durationMin ? parseInt(durationMin) : null,
        duration_max: durationMax ? parseInt(durationMax) : null,
        capacity: capacity ? parseInt(capacity) : null,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        images,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('prestataire_services')
        .update(serviceData)
        .eq('id', serviceId)
        .eq('user_id', user.id)

      if (error) throw error

      // Log activity
      await supabase.rpc('log_user_activity', {
        p_action_type: 'service_updated',
        p_action_details: `Service modifié: ${title}`
      })

      router.push('/prestataire/services')
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  function addImage() {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()])
      setNewImageUrl('')
    }
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index))
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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/prestataire/services"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-4 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux services
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Modifier le service</h1>
          <p className="text-neutral-500">Mettez à jour les informations de votre prestation</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-100 rounded-2xl p-8">
          {/* Informations de base */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Informations de base</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Titre du service *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                  placeholder="Ex: Animation DJ pour soirée d'entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Catégorie *</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm resize-none"
                  placeholder="Décrivez votre service en détail : ce qui est inclus, votre expérience, vos points forts..."
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="mb-8 pb-8 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Images</h2>

            <div className="space-y-4">
              {/* Images existantes */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-neutral-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Ajouter une image */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                  placeholder="URL de l'image"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="px-5 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all text-sm"
                >
                  Ajouter
                </button>
              </div>
              <p className="text-xs text-neutral-500">Ajoutez des URLs d'images hébergées en ligne</p>
            </div>
          </div>

          {/* Tarification */}
          <div className="mb-8 pb-8 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Tarification</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Type de tarification *</label>
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                >
                  <option value="fixed">Prix fixe</option>
                  <option value="hourly">Tarif horaire</option>
                  <option value="daily">Tarif journalier</option>
                  <option value="package">Forfait</option>
                  <option value="on_request">Sur devis</option>
                </select>
              </div>

              {priceType !== 'on_request' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Prix minimum (€) {priceType !== 'package' && '*'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required={priceType !== 'package'}
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Prix maximum (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Localisation */}
          <div className="mb-8 pb-8 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Localisation</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Type de prestation *</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                >
                  <option value="on_site">Sur site (je me déplace)</option>
                  <option value="remote">À distance</option>
                  <option value="both">Sur site et à distance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Zones desservies</label>
                <input
                  type="text"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                  placeholder="Ex: Paris, Île-de-France, Toute la France (séparés par des virgules)"
                />
              </div>
            </div>
          </div>

          {/* Détails supplémentaires */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Détails supplémentaires</h2>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Durée min (minutes)</label>
                  <input
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Durée max (minutes)</label>
                  <input
                    type="number"
                    value={durationMax}
                    onChange={(e) => setDurationMax(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                    placeholder="240"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Capacité (nombre de personnes)</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                  placeholder="Ex: 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Mots-clés</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                  placeholder="Ex: mariage, anniversaire, corporate (séparés par des virgules)"
                />
                <p className="text-xs text-neutral-500 mt-1.5">Ajoutez des mots-clés pour améliorer la visibilité</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/prestataire/services"
              className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-all text-sm"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
