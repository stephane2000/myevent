'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Conversation {
  id: string
  other_user_id: string
  other_user_name: string
  last_message: string | null
  last_message_at: string
  unread_count: number
}

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export default function MessagesPage() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setCurrentUserId(user.id)
    await loadConversations(user.id)
    setLoading(false)
  }

  async function loadConversations(userId: string) {
    const { data, error } = await supabase
      .rpc('get_user_conversations', {
        p_user_id: userId
      })

    if (error) {
      console.error('Erreur chargement conversations:', error)
    } else if (data) {
      setConversations(data)
    }
  }

  async function loadMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erreur chargement messages:', error)
    } else if (data) {
      setMessages(data)

      // Marquer comme lus
      const unreadMessages = data.filter(m => m.sender_id !== currentUserId && !m.is_read)
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(m => m.id))

        // Recharger les conversations pour mettre à jour le compteur
        if (currentUserId) loadConversations(currentUserId)
      }
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return

    setSending(true)

    const { error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: selectedConversation,
        sender_id: currentUserId,
        content: newMessage.trim()
      }])

    if (!error) {
      setNewMessage('')
      loadMessages(selectedConversation)
      loadConversations(currentUserId)
    }

    setSending(false)
  }

  function formatMessageTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
          <span className="text-neutral-500">Chargement...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Liste des conversations */}
          <div className="w-80 bg-white border border-neutral-100 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">Messages</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-500">Aucune conversation</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                      selectedConversation === conv.id ? 'bg-neutral-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-neutral-900 text-sm">{conv.other_user_name}</p>
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-0.5 bg-neutral-900 text-white rounded-full text-xs font-medium">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-neutral-500 line-clamp-1">{conv.last_message}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1">{formatMessageTime(conv.last_message_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Zone de messages */}
          <div className="flex-1 bg-white border border-neutral-100 rounded-2xl flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-neutral-100">
                  <p className="font-semibold text-neutral-900">
                    {conversations.find(c => c.id === selectedConversation)?.other_user_name}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          message.sender_id === currentUserId
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === currentUserId ? 'text-neutral-400' : 'text-neutral-500'
                        }`}>
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-neutral-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Écrivez votre message..."
                      className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-5 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-neutral-500">Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
