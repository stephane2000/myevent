'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function Parametres() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [bio, setBio] = useState('')

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'contacts'>('public')
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    // Charger les métadonnées utilisateur
    setFirstName(user.user_metadata?.first_name || '')
    setLastName(user.user_metadata?.last_name || '')

    // Charger les paramètres depuis user_settings via RPC
    const { data: settingsData, error } = await supabase
      .rpc('get_current_user_settings')

    if (error) {
      console.error('Erreur chargement paramètres:', error)
    } else if (settingsData && settingsData.length > 0) {
      const settings = settingsData[0]
      setPhone(settings.phone || '')
      setAddress(settings.address || '')
      setCity(settings.city || '')
      setPostalCode(settings.postal_code || '')
      setBio(settings.bio || '')
      setEmailNotifications(settings.email_notifications ?? true)
      setSmsNotifications(settings.sms_notifications ?? false)
      setMarketingEmails(settings.marketing_emails ?? false)
      setProfileVisibility(settings.profile_visibility || 'public')
      setShowEmail(settings.show_email ?? false)
      setShowPhone(settings.show_phone ?? false)
    }

    setLoading(false)
  }

  async function handleSaveProfile() {
    setSaving(true)
    setMessage(null)

    try {
      // Mettre à jour les métadonnées auth (prénom, nom)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName
        }
      })

      if (authError) throw authError

      // Mettre à jour ou créer les paramètres
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          phone,
          address,
          city,
          postal_code: postalCode,
          bio
        }, {
          onConflict: 'user_id'
        })

      if (settingsError) throw settingsError

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès!' })
    } catch (error: any) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveNotifications() {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          marketing_emails: marketingEmails
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Préférences de notification mises à jour!' })
    } catch (error: any) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePrivacy() {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          profile_visibility: profileVisibility,
          show_email: showEmail,
          show_phone: showPhone
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Paramètres de confidentialité mis à jour!' })
    } catch (error: any) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setSaving(true)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      setSaving(false)
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: error.message || 'Erreur lors du changement de mot de passe' })
    } finally {
      setSaving(false)
    }
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

      <main className="max-w-5xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Paramètres</h1>

        {/* Message de confirmation/erreur */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Informations personnelles */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations personnelles</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 rue de la Paix"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Paris"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code postal</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="75001"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Biographie</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Parlez-nous de vous..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder le profil'}
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>

            <div className="space-y-4 mb-6">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">Notifications par email</p>
                  <p className="text-sm text-gray-600">Recevoir des emails pour les activités importantes</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">Notifications SMS</p>
                  <p className="text-sm text-gray-600">Recevoir des SMS pour les messages urgents</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={(e) => setSmsNotifications(e.target.checked)}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">Emails marketing</p>
                  <p className="text-sm text-gray-600">Recevoir des offres et nouveautés</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketingEmails}
                  onChange={(e) => setMarketingEmails(e.target.checked)}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                />
              </label>
            </div>

            <button
              onClick={handleSaveNotifications}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder les notifications'}
            </button>
          </div>

          {/* Confidentialité */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Confidentialité</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Visibilité du profil</label>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'private' | 'contacts')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="public">Public - Visible par tous</option>
                <option value="contacts">Contacts uniquement</option>
                <option value="private">Privé - Visible uniquement par moi</option>
              </select>
            </div>

            <div className="space-y-4 mb-6">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">Afficher mon email</p>
                  <p className="text-sm text-gray-600">Rendre mon email visible sur mon profil public</p>
                </div>
                <input
                  type="checkbox"
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">Afficher mon téléphone</p>
                  <p className="text-sm text-gray-600">Rendre mon numéro visible sur mon profil public</p>
                </div>
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                />
              </label>
            </div>

            <button
              onClick={handleSavePrivacy}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder la confidentialité'}
            </button>
          </div>

          {/* Sécurité */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sécurité</h2>

            <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !newPassword || !confirmPassword}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50"
              >
                {saving ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>

          {/* Zone dangereuse */}
          <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-red-600 mb-6">Zone dangereuse</h2>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-gray-700 mb-4">
                  La suppression de votre compte est définitive et irréversible. Toutes vos données seront perdues.
                </p>
                <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all">
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
