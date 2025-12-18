'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Vérifier s'il y a des données en attente depuis l'inscription
        const pendingData = localStorage.getItem('pendingUserSettings')
        if (pendingData) {
          try {
            const settings = JSON.parse(pendingData)
            // Sauvegarder dans user_settings (upsert pour créer si n'existe pas)
            await supabase
              .from('user_settings')
              .upsert({
                user_id: data.user.id,
                ...settings
              })

            // Nettoyer le localStorage
            localStorage.removeItem('pendingUserSettings')
          } catch (err) {
            console.error('Erreur sauvegarde settings:', err)
          }
        }

        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-neutral-100 to-transparent rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-neutral-100 to-transparent rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-[400px] relative">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors mb-8 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Retour</span>
        </Link>

        <div className="bg-white/80 backdrop-blur-xl border border-neutral-200/60 rounded-3xl p-8 shadow-apple-lg">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-neutral-900 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900 text-center mb-1">
            Bon retour
          </h1>
          <p className="text-neutral-500 text-center mb-8 text-sm">
            Connectez-vous à votre compte
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                placeholder="votre@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wide">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-500 text-sm">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-neutral-900 font-medium hover:underline transition-colors">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
