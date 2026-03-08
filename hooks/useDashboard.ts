'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  fetchClients,
  fetchConversations,
  computeMetrics,
  buildChartData,
} from '@/lib/metrics'
import type { Client, Conversation, DashboardMetrics, ChartDataPoint } from '@/types/database'

interface DashboardState {
  clients: Client[]
  conversations: Conversation[]
  metrics: DashboardMetrics
  chartData: ChartDataPoint[]
  selectedClientId: string | null
  hoursBack: number
  isLoading: boolean
  lastUpdated: Date | null
  liveCount: number
}

const EMPTY_METRICS: DashboardMetrics = {
  totalLeads: 0,
  qualifiedLeads: 0,
  followUpLeads: 0,
  transferredLeads: 0,
  avgResponseTimeSeconds: 0,
  avgWaitTimeSeconds: 0,
  openConversations: 0,
  conversionRate: 0,
}

// initialClientId: passa o clientId do usuário logado para pré-filtrar
export function useDashboard(initialClientId?: string | null) {
  const [state, setState] = useState<DashboardState>({
    clients: [],
    conversations: [],
    metrics: EMPTY_METRICS,
    chartData: [],
    selectedClientId: initialClientId ?? null,
    hoursBack: 24,
    isLoading: true,
    lastUpdated: null,
    liveCount: 0,
  })

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const loadData = useCallback(async (clientId: string | null, hoursBack: number) => {
    try {
      const [clients, conversations] = await Promise.all([
        fetchClients(),
        fetchConversations(clientId, hoursBack),
      ])
      setState((prev) => ({
        ...prev,
        clients,
        conversations,
        metrics: computeMetrics(conversations),
        chartData: buildChartData(conversations),
        isLoading: false,
        lastUpdated: new Date(),
      }))
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          ...(state.selectedClientId ? { filter: `client_id=eq.${state.selectedClientId}` } : {}),
        },
        (payload) => {
          setState((prev) => {
            let updated = [...prev.conversations]

            if (payload.eventType === 'INSERT') {
              updated = [payload.new as Conversation, ...updated]
            } else if (payload.eventType === 'UPDATE') {
              updated = updated.map((c) =>
                c.id === (payload.new as Conversation).id ? (payload.new as Conversation) : c
              )
            } else if (payload.eventType === 'DELETE') {
              updated = updated.filter((c) => c.id !== (payload.old as Conversation).id)
            }

            return {
              ...prev,
              conversations: updated,
              metrics: computeMetrics(updated),
              chartData: buildChartData(updated),
              lastUpdated: new Date(),
              liveCount: prev.liveCount + 1,
            }
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [state.selectedClientId])

  // Initial load + reload on filter change
  useEffect(() => {
    setState((prev) => ({ ...prev, isLoading: true }))
    loadData(state.selectedClientId, state.hoursBack)
  }, [state.selectedClientId, state.hoursBack, loadData])

  const setClient = useCallback((clientId: string | null) => {
    setState((prev) => ({ ...prev, selectedClientId: clientId }))
  }, [])

  const setHoursBack = useCallback((hours: number) => {
    setState((prev) => ({ ...prev, hoursBack: hours }))
  }, [])

  const refresh = useCallback(() => {
    loadData(state.selectedClientId, state.hoursBack)
  }, [state.selectedClientId, state.hoursBack, loadData])

  return { ...state, setClient, setHoursBack, refresh }
}
