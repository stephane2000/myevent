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
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'security'>('profile')
  const router = useRouter()

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('+33')
  const [phoneNumber, setPhoneNumber] = useState('')
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

      // Parser le téléphone (format: +33 6 12 34 56 78)
      if (settings.phone) {
        const phoneMatch = settings.phone.match(/^(\+\d+)\s*(.*)$/)
        if (phoneMatch) {
          setPhoneCountry(phoneMatch[1])
          setPhoneNumber(phoneMatch[2].replace(/\s/g, ''))
        } else {
          setPhoneNumber(settings.phone)
        }
      }

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

      // Formater le téléphone
      const fullPhone = phoneNumber ? `${phoneCountry} ${phoneNumber}` : null

      // Mettre à jour ou créer les paramètres
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          phone: fullPhone,
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

      <main className="max-w-6xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Paramètres</h1>
          <p className="text-gray-600">Gérez vos informations personnelles et vos préférences</p>
        </div>

        {/* Message de confirmation/erreur */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <span className="text-xl">{message.type === 'success' ? '✓' : '✕'}</span>
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white border border-gray-200 rounded-2xl p-2 sticky top-24">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all mb-1 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                👤 Profil
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all mb-1 ${
                  activeTab === 'notifications'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                🔔 Notifications
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all mb-1 ${
                  activeTab === 'privacy'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                🔒 Confidentialité
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'security'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                🛡️ Sécurité
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations personnelles</h2>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                    <div className="flex gap-3">
                      <select
                        value={phoneCountry}
                        onChange={(e) => setPhoneCountry(e.target.value)}
                        className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+32">🇧🇪 +32</option>
                        <option value="+41">🇨🇭 +41</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+39">🇮🇹 +39</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="6 12 34 56 78"
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 rue de la Paix"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Paris"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Code postal</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="75001"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Biographie</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      placeholder="Parlez-nous de vous..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h2>
                <p className="text-gray-600 mb-6">Choisissez comment vous souhaitez être notifié</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl">
                        📧
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Notifications par email</p>
                        <p className="text-sm text-gray-600">Messages, demandes et activités importantes</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        emailNotifications ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          emailNotifications ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl">
                        💬
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Notifications SMS</p>
                        <p className="text-sm text-gray-600">Alertes urgentes et confirmations</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSmsNotifications(!smsNotifications)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        smsNotifications ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          smsNotifications ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl">
                        🎯
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Emails marketing</p>
                        <p className="text-sm text-gray-600">Offres spéciales et nouveautés</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMarketingEmails(!marketingEmails)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        marketingEmails ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          marketingEmails ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Sauvegarder les préférences'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Confidentialité</h2>
                <p className="text-gray-600 mb-6">Contrôlez qui peut voir vos informations</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Visibilité du profil</label>
                    <div className="grid gap-3">
                      <button
                        onClick={() => setProfileVisibility('public')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          profileVisibility === 'public'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white">
                            🌍
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Public</p>
                            <p className="text-sm text-gray-600">Visible par tous les utilisateurs</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setProfileVisibility('contacts')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          profileVisibility === 'contacts'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white">
                            👥
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Contacts uniquement</p>
                            <p className="text-sm text-gray-600">Visible par vos contacts seulement</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setProfileVisibility('private')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          profileVisibility === 'private'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white">
                            🔒
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Privé</p>
                            <p className="text-sm text-gray-600">Visible uniquement par vous</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Informations publiques</label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-gray-900">Afficher mon email</p>
                          <p className="text-sm text-gray-600">Visible sur votre profil public</p>
                        </div>
                        <button
                          onClick={() => setShowEmail(!showEmail)}
                          className={`relative w-14 h-8 rounded-full transition-colors ${
                            showEmail ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                              showEmail ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-gray-900">Afficher mon téléphone</p>
                          <p className="text-sm text-gray-600">Visible sur votre profil public</p>
                        </div>
                        <button
                          onClick={() => setShowPhone(!showPhone)}
                          className={`relative w-14 h-8 rounded-full transition-colors ${
                            showPhone ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                              showPhone ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSavePrivacy}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Enregistrement...' : 'Sauvegarder les paramètres'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe</h2>
                  <p className="text-gray-600 mb-6">Modifiez votre mot de passe</p>

                  <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

                <div className="bg-white border-2 border-red-200 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-red-600 mb-2">Zone dangereuse</h2>
                  <p className="text-gray-600 mb-6">Actions irréversibles sur votre compte</p>

                  <div className="p-5 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">
                        ⚠️
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2">Supprimer mon compte</p>
                        <p className="text-sm text-gray-600 mb-4">
                          Cette action est définitive. Toutes vos données seront supprimées et ne pourront pas être récupérées.
                        </p>
                        <button className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all text-sm">
                          Supprimer définitivement
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
