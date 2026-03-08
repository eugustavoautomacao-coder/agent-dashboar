import { supabase } from './supabase'
import type { Conversation, DashboardMetrics, ChartDataPoint } from '@/types/database'
import { subHours, format, startOfHour } from 'date-fns'

export async function fetchClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function fetchConversations(
  clientId: string | null,
  hoursBack = 24
): Promise<Conversation[]> {
  const since = subHours(new Date(), hoursBack).toISOString()

  let query = supabase
    .from('conversations')
    .select('*, clients(name), agents(name)')
    .gte('started_at', since)
    .order('started_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Conversation[]
}

export function computeMetrics(conversations: Conversation[]): DashboardMetrics {
  const total = conversations.length
  const qualified = conversations.filter((c) => c.is_qualified).length
  const followUp = conversations.filter((c) => c.is_follow_up).length
  const transferred = conversations.filter((c) => c.status === 'transferred').length
  const open = conversations.filter((c) => c.status === 'open' || c.status === 'attending').length

  // Tempo médio de resposta (started_at → first_response_at)
  const responseTimes = conversations
    .filter((c) => c.first_response_at)
    .map((c) => {
      const diff = new Date(c.first_response_at!).getTime() - new Date(c.started_at).getTime()
      return diff / 1000 // segundos
    })
    .filter((v) => v > 0 && v < 3600) // excluir outliers > 1h

  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

  // Tempo médio de espera até atendente (handoff_requested_at → attendant_joined_at)
  const waitTimes = conversations
    .filter((c) => c.handoff_requested_at && c.attendant_joined_at)
    .map((c) => {
      const diff =
        new Date(c.attendant_joined_at!).getTime() -
        new Date(c.handoff_requested_at!).getTime()
      return diff / 1000
    })
    .filter((v) => v > 0 && v < 7200)

  const avgWaitTime =
    waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0

  return {
    totalLeads: total,
    qualifiedLeads: qualified,
    followUpLeads: followUp,
    transferredLeads: transferred,
    avgResponseTimeSeconds: Math.round(avgResponseTime),
    avgWaitTimeSeconds: Math.round(avgWaitTime),
    openConversations: open,
    conversionRate: total > 0 ? Math.round((qualified / total) * 100) : 0,
  }
}

export function buildChartData(conversations: Conversation[]): ChartDataPoint[] {
  const buckets = new Map<string, ChartDataPoint>()

  // Criar buckets para as últimas 24h (por hora)
  for (let i = 23; i >= 0; i--) {
    const hour = format(startOfHour(subHours(new Date(), i)), 'HH:mm')
    buckets.set(hour, { hour, leads: 0, qualified: 0, followUp: 0 })
  }

  for (const conv of conversations) {
    const hour = format(startOfHour(new Date(conv.started_at)), 'HH:mm')
    const bucket = buckets.get(hour)
    if (!bucket) continue
    bucket.leads++
    if (conv.is_qualified) bucket.qualified++
    if (conv.is_follow_up) bucket.followUp++
  }

  return Array.from(buckets.values())
}

export function formatDuration(seconds: number): string {
  if (seconds === 0) return '—'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
}
