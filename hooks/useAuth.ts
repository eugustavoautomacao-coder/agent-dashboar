'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  clientId: string | null
  clientName: string | null
  isAdmin: boolean
  isLoading: boolean
}

export function useAuth() {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    clientId: null,
    clientName: null,
    isAdmin: false,
    isLoading: true,
  })

  // Busca a qual cliente o usuário pertence
  const fetchClientBinding = useCallback(async (userId: string) => {
    const { data: binding, error } = await supabase
      .from('client_users')
      .select('client_id, role')
      .eq('user_id', userId)
      .single() as { data: { client_id: string; role: string } | null; error: unknown }

    if (error || !binding) return { clientId: null, clientName: null, isAdmin: false }

    const { data: client } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', binding.client_id)
      .single() as { data: { id: string; name: string } | null; error: unknown }

    return {
      clientId: client?.id ?? null,
      clientName: client?.name ?? null,
      isAdmin: binding.role === 'admin',
    }
  }, [])

  useEffect(() => {
    // Carrega sessão inicial
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setState({ user: null, clientId: null, clientName: null, isAdmin: false, isLoading: false })
        return
      }
      const binding = await fetchClientBinding(user.id)
      setState({ user, ...binding, isLoading: false })
    })

    // Escuta mudanças de sessão (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setState({ user: null, clientId: null, clientName: null, isAdmin: false, isLoading: false })
        router.push('/login')
        return
      }
      const binding = await fetchClientBinding(session.user.id)
      setState({ user: session.user, ...binding, isLoading: false })
    })

    return () => subscription.unsubscribe()
  }, [fetchClientBinding, router])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { ...state, signOut }
}
