'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg"></div>
            <span className="text-xl font-bold text-white tracking-tight">MyEvent</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20"
            >
              Créer un compte
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Organisez l'événement
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              de vos rêves
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plateforme qui connecte clients et prestataires événementiels.
            DJ, traiteurs, photographes... Trouvez le partenaire idéal pour votre événement.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-2xl shadow-amber-500/30"
            >
              Commencer gratuitement
            </Link>
            <button className="px-8 py-4 bg-slate-800/50 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all backdrop-blur-sm border border-slate-700/50">
              En savoir plus
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1 - Clients */}
            <div
              className="group relative p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-amber-500/50 transition-all duration-300 backdrop-blur-sm"
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">Pour les clients</h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  Trouvez facilement des prestataires qualifiés pour votre événement.
                  Comparez, échangez et réservez en quelques clics.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Recherche simplifiée</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Avis vérifiés</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Devis instantanés</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2 - Prestataires */}
            <div
              className="group relative p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:border-amber-500/50 transition-all duration-300 backdrop-blur-sm"
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">Pour les prestataires</h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  Mettez en avant vos services et développez votre activité.
                  Recevez des demandes qualifiées directement.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Profil professionnel</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Gestion des demandes</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Visibilité maximale</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-3xl p-12 border border-slate-800/50 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Rejoignez des centaines de clients et prestataires satisfaits
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-2xl shadow-amber-500/30"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>© 2026 MyEvent. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
