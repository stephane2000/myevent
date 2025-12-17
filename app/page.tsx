'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/[0.03] rounded-full text-sm text-neutral-600 mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Plateforme événementielle #1 en France
          </div>
          
          <h1 className="text-5xl md:text-6xl font-semibold text-neutral-900 mb-6 tracking-tight leading-[1.1]">
            Créez des événements
            <br />
            <span className="text-neutral-400">inoubliables.</span>
          </h1>
          
          <p className="text-lg text-neutral-500 mb-10 max-w-xl mx-auto leading-relaxed font-light">
            Connectez-vous avec les meilleurs prestataires événementiels. Simple, rapide, efficace.
          </p>

          <div className="flex gap-3 justify-center">
            <Link
              href="/register"
              className="px-7 py-3.5 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/prestataires"
              className="px-7 py-3.5 bg-white text-neutral-700 rounded-full font-medium hover:bg-neutral-50 transition-all border border-neutral-200 hover:border-neutral-300"
            >
              Explorer
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5">
            {/* Card 1 - Clients */}
            <div className="group p-8 rounded-3xl bg-white border border-neutral-100 hover:border-neutral-200 transition-all duration-300 hover-lift">
              <div className="w-11 h-11 bg-neutral-100 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Pour les organisateurs
              </h3>
              <p className="text-neutral-500 leading-relaxed mb-6 text-[15px]">
                Trouvez facilement des prestataires qualifiés. Comparez, échangez et réservez en quelques clics.
              </p>

              <div className="space-y-2.5">
                {['Recherche intelligente', 'Avis vérifiés', 'Devis instantanés'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-neutral-600">
                    <div className="w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 - Prestataires */}
            <div className="group p-8 rounded-3xl bg-white border border-neutral-100 hover:border-neutral-200 transition-all duration-300 hover-lift">
              <div className="w-11 h-11 bg-neutral-100 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Pour les prestataires
              </h3>
              <p className="text-neutral-500 leading-relaxed mb-6 text-[15px]">
                Développez votre activité et recevez des demandes qualifiées directement.
              </p>

              <div className="space-y-2.5">
                {['Profil professionnel', 'Gestion des demandes', 'Visibilité maximale'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-neutral-600">
                    <div className="w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="text-center p-8 rounded-3xl bg-white border border-neutral-100">
              <div className="text-4xl font-semibold text-neutral-900 mb-1">500+</div>
              <p className="text-neutral-500 text-sm">Prestataires vérifiés</p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-white border border-neutral-100">
              <div className="text-4xl font-semibold text-neutral-900 mb-1">2000+</div>
              <p className="text-neutral-500 text-sm">Événements réussis</p>
            </div>
            <div className="text-center p-8 rounded-3xl bg-white border border-neutral-100">
              <div className="text-4xl font-semibold text-neutral-900 mb-1">98%</div>
              <p className="text-neutral-500 text-sm">Clients satisfaits</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-neutral-900 text-white">
            <h2 className="text-3xl font-semibold mb-4">Prêt à commencer ?</h2>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto">
              Rejoignez des milliers d'organisateurs et prestataires qui font confiance à MyEvent.
            </p>
            <Link
              href="/register"
              className="inline-flex px-7 py-3.5 bg-white text-neutral-900 rounded-full font-medium hover:bg-neutral-100 transition-all"
            >
              Créer mon compte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-neutral-900 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-sm text-neutral-600">© 2024 MyEvent</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-500">
            <Link href="#" className="hover:text-neutral-900 transition-colors">Confidentialité</Link>
            <Link href="#" className="hover:text-neutral-900 transition-colors">Conditions</Link>
            <Link href="#" className="hover:text-neutral-900 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
