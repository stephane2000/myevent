'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

interface Annonce {
  id: string
  titre: string
  lieu: string
  budget: number
  created_at: string
}

interface Prestataire {
  id: string
  nom: string
  categorie: string
  note_moyenne: number
  nombre_avis: number
  avatar_url?: string
}

export default function Home() {
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [prestataires, setPrestataires] = useState<Prestataire[]>([])
  const [loadingAnnonces, setLoadingAnnonces] = useState(true)
  const [loadingPrestas, setLoadingPrestas] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetchAnnonces()
    fetchPrestataires()
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  async function fetchAnnonces() {
    try {
      const { data, error } = await supabase
        .from('annonces')
        .select('id, titre, lieu, budget, created_at')
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (error) throw error
      setAnnonces(data || [])
    } catch (error) {
      console.error('Erreur chargement annonces:', error)
      setAnnonces([])
    } finally {
      setLoadingAnnonces(false)
    }
  }

  async function fetchPrestataires() {
    try {
      const { data, error } = await supabase
        .from('prestataires')
        .select('id, nom, categorie, note_moyenne, nombre_avis, avatar_url')
        .order('note_moyenne', { ascending: false })
        .limit(4)
      
      if (error) throw error
      setPrestataires(data || [])
    } catch (error) {
      console.error('Erreur chargement prestataires:', error)
      setPrestataires([])
    } finally {
      setLoadingPrestas(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'À l\'instant'
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <div className="min-h-screen bg-[#fffbf8]">
      <Navbar />

      {/* Hero Section - Full viewport height */}
      <section className="min-h-screen flex flex-col justify-center px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 border border-stone-200 rounded-full text-sm text-stone-600 mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Trouvez le prestataire idéal pour vos événements
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-stone-900 mb-6 tracking-tight leading-[1.08]">
            Créez des événements
            <br />
            <span className="text-stone-400">inoubliables.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-stone-500 mb-12 max-w-xl mx-auto leading-relaxed">
            Connectez-vous avec les meilleurs prestataires événementiels. Simple, rapide, efficace.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-stone-900/10"
                >
                  Mon tableau de bord
                </Link>
                <Link
                  href="/annonces/new"
                  className="px-8 py-4 bg-white text-stone-700 rounded-full font-medium hover:bg-stone-50 transition-all border border-stone-200 hover:border-stone-300"
                >
                  Publier une annonce
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-stone-900/10"
                >
                  S'inscrire gratuitement
                </Link>
                <Link
                  href="/prestataires"
                  className="px-8 py-4 bg-white text-stone-700 rounded-full font-medium hover:bg-stone-50 transition-all border border-stone-200 hover:border-stone-300"
                >
                  Explorer
                </Link>
              </>
            )}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:flex flex-col items-center gap-2">
            <span className="text-xs text-stone-400 font-medium">Défiler</span>
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-stone-900 mb-3">Comment ça marche ?</h2>
            <p className="text-stone-500">Trois étapes simples pour trouver le prestataire idéal</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-semibold">1</div>
              <h3 className="font-semibold text-stone-900 mb-2">Décrivez votre besoin</h3>
              <p className="text-stone-500">Publiez votre annonce en quelques clics</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-semibold">2</div>
              <h3 className="font-semibold text-stone-900 mb-2">Recevez des devis</h3>
              <p className="text-stone-500">Les prestataires vous contactent</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-semibold">3</div>
              <h3 className="font-semibold text-stone-900 mb-2">Choisissez le meilleur</h3>
              <p className="text-stone-500">Comparez et réservez en toute confiance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meilleurs prestataires */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-stone-900">Meilleurs prestataires</h2>
              <p className="text-stone-500 mt-1">Les mieux notés par la communauté</p>
            </div>
            <Link href="/prestataires" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1">
              Voir tout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loadingPrestas ? (
            <div className="grid md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-stone-100 animate-pulse">
                  <div className="w-12 h-12 bg-stone-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : prestataires.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-stone-50">
              <svg className="w-12 h-12 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-stone-500">Aucun prestataire pour le moment</p>
              <p className="text-sm text-stone-400 mt-1">Soyez le premier à vous inscrire !</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-4">
              {prestataires.map((presta) => (
                <Link 
                  key={presta.id} 
                  href={`/prestataires/${presta.id}`}
                  className="group p-5 rounded-2xl bg-white border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 font-semibold mb-4 group-hover:bg-stone-900 group-hover:text-white transition-all">
                    {presta.nom?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <h3 className="font-medium text-stone-900 mb-0.5">{presta.nom}</h3>
                  <p className="text-xs text-stone-500 mb-3">{presta.categorie}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 text-amber-500">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium text-stone-900">{presta.note_moyenne?.toFixed(1) || '—'}</span>
                    </div>
                    <span className="text-xs text-stone-400">({presta.nombre_avis || 0} avis)</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Dernières annonces */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-stone-900">Dernières annonces</h2>
              <p className="text-stone-500 mt-1">Les opportunités récentes</p>
            </div>
            <Link href="/annonces" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1">
              Voir tout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loadingAnnonces ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-stone-100 animate-pulse">
                  <div className="flex justify-between mb-3">
                    <div className="h-3 bg-stone-200 rounded w-16"></div>
                    <div className="h-5 bg-stone-200 rounded w-12"></div>
                  </div>
                  <div className="h-4 bg-stone-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : annonces.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white border border-stone-100">
              <svg className="w-12 h-12 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-stone-500">Aucune annonce pour le moment</p>
              <p className="text-sm text-stone-400 mt-1">Publiez la première annonce !</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {annonces.map((annonce) => (
                <Link 
                  key={annonce.id} 
                  href={`/annonces/${annonce.id}`}
                  className="group p-5 rounded-2xl bg-white border border-stone-100 hover:border-stone-200 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs text-stone-400">{formatDate(annonce.created_at)}</span>
                    <span className="text-xs font-medium text-stone-900 bg-amber-50 text-amber-700 px-2 py-1 rounded-full">{annonce.budget}€</span>
                  </div>
                  <h3 className="font-medium text-stone-900 mb-1 group-hover:text-stone-700">{annonce.titre}</h3>
                  <div className="flex items-center gap-1 text-stone-500 text-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {annonce.lieu}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-100 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
                <span className="font-semibold text-stone-900">MyEvent</span>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed">
                La plateforme qui connecte organisateurs et prestataires événementiels.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-stone-900 mb-3 text-sm">Plateforme</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><Link href="/prestataires" className="hover:text-stone-900 transition-colors">Prestataires</Link></li>
                <li><Link href="/annonces" className="hover:text-stone-900 transition-colors">Annonces</Link></li>
                {!user && (
                  <li><Link href="/register" className="hover:text-stone-900 transition-colors">Inscription</Link></li>
                )}
                {user && (
                  <li><Link href="/dashboard" className="hover:text-stone-900 transition-colors">Tableau de bord</Link></li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-stone-900 mb-3 text-sm">Ressources</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><Link href="#" className="hover:text-stone-900 transition-colors">Centre d'aide</Link></li>
                <li><Link href="#" className="hover:text-stone-900 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-stone-900 transition-colors">Guides</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-stone-900 mb-3 text-sm">Légal</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li><Link href="#" className="hover:text-stone-900 transition-colors">Confidentialité</Link></li>
                <li><Link href="#" className="hover:text-stone-900 transition-colors">CGU</Link></li>
                <li><Link href="#" className="hover:text-stone-900 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-stone-400">© 2026 MyEvent. Tous droits réservés.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="text-stone-400 hover:text-stone-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-stone-400 hover:text-stone-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="text-stone-400 hover:text-stone-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
