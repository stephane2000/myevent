'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const [step, setStep] = useState(1)
  const [userRole, setUserRole] = useState<'client' | 'prestataire'>('client')
  
  // Étape 1 - Infos de base
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Étape 2 - Infos complémentaires
  const [phoneCountryCode, setPhoneCountryCode] = useState('+33')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  
  // Étape 3 - Pour prestataires uniquement
  const [companyName, setCompanyName] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')
  const [description, setDescription] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const totalSteps = userRole === 'prestataire' ? 3 : 2

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

  function canProceed() {
    if (step === 1) {
      return firstName && lastName && email && password.length >= 6
    }
    if (step === 2) {
      return phone && address && city && postalCode
    }
    if (step === 3) {
      return companyName && serviceCategory
    }
    return true
  }

  async function handleRegister() {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: userRole,
            company_name: userRole === 'prestataire' ? companyName : null,
            service_category: userRole === 'prestataire' ? serviceCategory : null,
            description: userRole === 'prestataire' ? description : null,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Sauvegarder les données dans user_settings
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({
            user_id: data.user.id,
            phone: `${phoneCountryCode}${phone}`,
            address: address,
            city: city,
            postal_code: postalCode,
          })

        if (settingsError) {
          console.error('Erreur lors de la sauvegarde des paramètres:', settingsError)
        }

        alert('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.')
        router.push('/login')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      handleRegister()
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-screen bg-[#fffbf8] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-stone-100 to-transparent rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-stone-100 to-transparent rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-[440px] relative">
        <div className="bg-white/80 backdrop-blur-xl border border-stone-200/60 rounded-3xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <p className="text-stone-500 text-sm mb-4">
              Étape {step} sur {totalSteps}
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <span className="text-xl font-bold text-stone-900">PrestaBase</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-8">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i + 1 <= step ? 'bg-stone-900' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-stone-900 mb-1">Créer un compte</h1>
                <p className="text-stone-500 text-sm">Rejoignez PrestaBase gratuitement</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wide">Je suis</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserRole('client')}
                    className={`p-4 rounded-2xl border-2 transition-all text-center ${
                      userRole === 'client'
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="font-medium">Organisateur</span>
                      <span className={`text-xs ${userRole === 'client' ? 'text-stone-300' : 'text-stone-400'}`}>
                        Je cherche un prestataire
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserRole('prestataire')}
                    className={`p-4 rounded-2xl border-2 transition-all text-center ${
                      userRole === 'prestataire'
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Prestataire</span>
                      <span className={`text-xs ${userRole === 'prestataire' ? 'text-stone-300' : 'text-stone-400'}`}>
                        Je propose mes services
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Prénom</label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Nom</label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm"
                  placeholder="jean@email.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete="new-password"
                />
                <p className="text-xs text-stone-400 mt-1.5">Minimum 6 caractères</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-stone-900 mb-1">Vos coordonnées</h1>
                <p className="text-stone-500 text-sm">Pour vous contacter et vous localiser</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Téléphone</label>
                <div className="flex gap-2">
                  <select
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className="w-24 px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+32">🇧🇪 +32</option>
                    <option value="+41">🇨🇭 +41</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm"
                    placeholder="6 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Adresse complète</label>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm"
                  placeholder="12 rue de la Paix"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="postalCode" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Code postal</label>
                  <input
                    id="postalCode"
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm"
                    placeholder="75001"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Ville</label>
                  <input
                    id="city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm"
                    placeholder="Paris"
                  />
                </div>
              </div>

              {userRole === 'client' && (
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-stone-200 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-700">Dernière étape !</p>
                      <p className="text-xs text-stone-500 mt-0.5">Vous pourrez compléter votre profil et publier votre première annonce après inscription.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && userRole === 'prestataire' && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-stone-900 mb-1">Votre activité</h1>
                <p className="text-stone-500 text-sm">Présentez vos services aux clients</p>
              </div>

              <div>
                <label htmlFor="companyName" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Nom de votre entreprise / activité</label>
                <input
                  id="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm"
                  placeholder="DJ Max Events"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Catégorie de service</label>
                <select
                  id="category"
                  required
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                  Description <span className="text-stone-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-sm resize-none"
                  placeholder="Décrivez brièvement vos services, votre expérience..."
                />
              </div>

              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-stone-200 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-700">Presque terminé !</p>
                    <p className="text-xs text-stone-500 mt-0.5">Vous pourrez ajouter vos tarifs, photos et disponibilités depuis votre tableau de bord.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mt-5">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl font-medium transition-all text-sm"
              >
                Retour
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || !canProceed()}
              className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Inscription...
                </span>
              ) : step < totalSteps ? (
                'Continuer'
              ) : (
                'Créer mon compte'
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-stone-500 text-sm">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-stone-900 font-medium hover:underline transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 text-stone-500 hover:text-stone-900 transition-colors mt-6 text-sm w-full"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Revenir à l'accueil</span>
        </Link>
      </div>
    </div>
  )
}