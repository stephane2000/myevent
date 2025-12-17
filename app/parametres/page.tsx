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

  // Toggle switch component
  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        enabled ? 'bg-neutral-900' : 'bg-neutral-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )

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

      <main className="max-w-5xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-1">Paramètres</h1>
          <p className="text-neutral-500 text-sm">Gérez vos informations et préférences</p>
        </div>

        {/* Message de confirmation/erreur */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-100 text-green-700'
              : 'bg-red-50 border border-red-100 text-red-700'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {message.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white border border-neutral-100 rounded-2xl p-1.5 sticky top-24">
              {[
                { id: 'profile', icon: '👤', label: 'Profil' },
                { id: 'notifications', icon: '🔔', label: 'Notifications' },
                { id: 'privacy', icon: '🔒', label: 'Confidentialité' },
                { id: 'security', icon: '🛡️', label: 'Sécurité' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all mb-0.5 last:mb-0 ${
                    activeTab === tab.id
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-semibold text-neutral-900 mb-1">Informations personnelles</h2>
                <p className="text-neutral-500 text-sm mb-6">Mettez à jour vos informations de profil</p>

                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Prénom</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-sm"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Nom</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-sm"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-400 cursor-not-allowed text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Téléphone</label>
                    <div className="flex gap-2">
                      <select
                        value={phoneCountry}
                        onChange={(e) => setPhoneCountry(e.target.value)}
                        className="px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      >
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+32">🇧🇪 +32</option>
                        <option value="+41">🇨🇭 +41</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="6 12 34 56 78"
                        className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Adresse</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 rue de la Paix"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Ville</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Paris"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Code postal</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="75001"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Biographie</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      placeholder="Parlez-nous de vous..."
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none text-sm"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Enregistrement...' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-semibold text-neutral-900 mb-1">Notifications</h2>
                <p className="text-neutral-500 text-sm mb-6">Gérez vos préférences de notification</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">Notifications par email</p>
                        <p className="text-xs text-neutral-500">Messages et activités importantes</p>
                      </div>
                    </div>
                    <Toggle enabled={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">Notifications SMS</p>
                        <p className="text-xs text-neutral-500">Alertes urgentes uniquement</p>
                      </div>
                    </div>
                    <Toggle enabled={smsNotifications} onChange={() => setSmsNotifications(!smsNotifications)} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">Emails marketing</p>
                        <p className="text-xs text-neutral-500">Offres et nouveautés</p>
                      </div>
                    </div>
                    <Toggle enabled={marketingEmails} onChange={() => setMarketingEmails(!marketingEmails)} />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-semibold text-neutral-900 mb-1">Confidentialité</h2>
                <p className="text-neutral-500 text-sm mb-6">Contrôlez la visibilité de vos informations</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Visibilité du profil</label>
                    <div className="space-y-2">
                      {[
                        { id: 'public', icon: '🌍', label: 'Public', desc: 'Visible par tous' },
                        { id: 'contacts', icon: '👥', label: 'Contacts', desc: 'Contacts uniquement' },
                        { id: 'private', icon: '🔒', label: 'Privé', desc: 'Vous uniquement' }
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setProfileVisibility(option.id as any)}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            profileVisibility === option.id
                              ? 'border-neutral-900 bg-neutral-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{option.icon}</span>
                            <div>
                              <p className="font-medium text-neutral-900 text-sm">{option.label}</p>
                              <p className="text-xs text-neutral-500">{option.desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-6">
                    <label className="block text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Informations publiques</label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">Afficher mon email</p>
                          <p className="text-xs text-neutral-500">Sur votre profil public</p>
                        </div>
                        <Toggle enabled={showEmail} onChange={() => setShowEmail(!showEmail)} />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">Afficher mon téléphone</p>
                          <p className="text-xs text-neutral-500">Sur votre profil public</p>
                        </div>
                        <Toggle enabled={showPhone} onChange={() => setShowPhone(!showPhone)} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSavePrivacy}
                      disabled={saving}
                      className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Enregistrement...' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white border border-neutral-100 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-1">Mot de passe</h2>
                  <p className="text-neutral-500 text-sm mb-6">Modifiez votre mot de passe</p>

                  <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">Confirmer</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving || !newPassword || !confirmPassword}
                      className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Modification...' : 'Changer le mot de passe'}
                    </button>
                  </form>
                </div>

                <div className="bg-white border border-red-100 rounded-2xl p-6 md:p-8">
                  <h2 className="text-xl font-semibold text-red-600 mb-1">Zone dangereuse</h2>
                  <p className="text-neutral-500 text-sm mb-6">Actions irréversibles</p>

                  <div className="p-4 bg-red-50 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900 text-sm mb-1">Supprimer mon compte</p>
                        <p className="text-xs text-neutral-600 mb-3">
                          Cette action est définitive et ne peut pas être annulée.
                        </p>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all">
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
