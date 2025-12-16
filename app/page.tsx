'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">MyEvent</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/20"
            >
              Créer un compte
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            Organisez l'événement
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              de vos rêves
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plateforme qui connecte <span className="text-blue-600 font-semibold">clients</span> et{' '}
            <span className="text-orange-600 font-semibold">prestataires événementiels</span>.
            DJ, traiteurs, photographes... Trouvez le{' '}
            <span className="text-green-600 font-semibold">partenaire idéal</span> pour votre événement.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-2xl shadow-purple-500/30"
            >
              Commencer gratuitement
            </Link>
            <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-all border border-purple-200">
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
            <div className="group relative p-8 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Pour les <span className="text-blue-600">clients</span>
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Trouvez facilement des prestataires qualifiés pour votre événement.
                  Comparez, échangez et réservez en quelques clics.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Recherche simplifiée</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Avis vérifiés</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Devis instantanés</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2 - Prestataires */}
            <div className="group relative p-8 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Pour les <span className="text-orange-600">prestataires</span>
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Mettez en avant vos services et développez votre activité.
                  Recevez des demandes qualifiées directement.
                </p>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Profil professionnel</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Gestion des demandes</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
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
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-12 border border-purple-200 shadow-xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Prêt à <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">commencer</span> ?
            </h2>
            <p className="text-gray-700 mb-8 text-lg">
              Rejoignez des centaines de clients et prestataires <span className="text-green-600 font-semibold">satisfaits</span>
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-2xl shadow-purple-500/30"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-100 py-8 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2024 MyEvent. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
