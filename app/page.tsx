'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
            L'événement parfait commence ici
          </h1>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connectez-vous avec des prestataires événementiels de qualité. DJ, traiteurs, photographes...
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all shadow-2xl shadow-orange-500/30"
            >
              Créer mon compte
            </Link>
            <Link
              href="/prestataires"
              className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-all border border-orange-200"
            >
              Trouver un prestataire
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1 - Clients */}
            <div className="group relative p-8 rounded-2xl bg-white border border-orange-100 hover:border-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Pour les organisateurs
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Trouvez facilement des prestataires qualifiés pour votre événement.
                  Comparez, échangez et réservez en quelques clics.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Recherche simplifiée</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Avis vérifiés</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Devis instantanés</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2 - Prestataires */}
            <div className="group relative p-8 rounded-2xl bg-white border border-orange-100 hover:border-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Pour les prestataires
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Mettez en avant vos services et développez votre activité.
                  Recevez des demandes qualifiées directement.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Profil professionnel</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Gestion des demandes</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Visibilité maximale</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl border border-orange-100 shadow-lg">
              <div className="text-4xl font-bold text-orange-600 mb-2">500+</div>
              <p className="text-gray-600">Prestataires qualifiés</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl border border-orange-100 shadow-lg">
              <div className="text-4xl font-bold text-orange-600 mb-2">2000+</div>
              <p className="text-gray-600">Événements réussis</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl border border-orange-100 shadow-lg">
              <div className="text-4xl font-bold text-orange-600 mb-2">98%</div>
              <p className="text-gray-600">Clients satisfaits</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orange-100 py-8 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2024 MyEvent. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
