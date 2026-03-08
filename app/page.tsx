'use client'

import { useDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'
import { KPICard } from '@/components/KPICard'
import { LeadsChart } from '@/components/LeadsChart'
import { StatusDistribution } from '@/components/StatusDistribution'
import { RecentLeadsTable } from '@/components/RecentLeadsTable'
import { formatDuration } from '@/lib/metrics'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import {
  Users,
  CheckCircle,
  RefreshCw,
  Clock,
  UserCheck,
  Bot,
  Activity,
  LogOut,
  Shield,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, clientId: authClientId, clientName: authClientName, isAdmin, isSuperAdmin, isLoading: authLoading, signOut } = useAuth()

  const {
    clients,
    conversations,
    metrics,
    chartData,
    selectedClientId,
    hoursBack,
    isLoading,
    lastUpdated,
    liveCount,
    setClient,
    setHoursBack,
    refresh,
  } = useDashboard(authClientId)

  // Admin vê todos os clientes; cliente comum vê apenas o próprio
  const selectedClient = isAdmin
    ? clients.find((c) => c.id === selectedClientId)
    : clients.find((c) => c.id === authClientId)

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo + título */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Agentes IA</h1>
                <p className="text-[10px] text-slate-400 leading-none">Dashboard</p>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* Botão Super Admin */}
              {isSuperAdmin && (
                <button
                  onClick={() => router.push('/super-admin')}
                  className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-600/10 px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-600/20"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Super Admin
                </button>
              )}

              {/* Filtro de cliente — apenas admin vê o seletor */}
              {isAdmin && (
                <select
                  value={selectedClientId ?? ''}
                  onChange={(e) => setClient(e.target.value || null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Todos os clientes</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Filtro de período */}
              <select
                value={hoursBack}
                onChange={(e) => setHoursBack(Number(e.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value={6}>Últimas 6h</option>
                <option value={24}>Últimas 24h</option>
                <option value={48}>Últimas 48h</option>
                <option value={168}>Últimos 7 dias</option>
              </select>

              {/* Botão refresh */}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>

              {/* Indicador live */}
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-medium text-emerald-400">AO VIVO</span>
              </div>

              {/* Usuário + logout */}
              <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-medium text-white leading-none">{user?.email?.split('@')[0]}</p>
                  <p className="text-[9px] text-slate-500 leading-none mt-0.5">
                    {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : (authClientName ?? 'Cliente')}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  title="Sair"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
        {/* Sub-header com info */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isAdmin
                ? (selectedClient ? selectedClient.name : 'Visão Geral — Todos os Clientes')
                : (authClientName ?? 'Meu Dashboard')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {lastUpdated
                ? `Atualizado ${format(lastUpdated, 'HH:mm:ss', { locale: ptBR })}`
                : 'Carregando...'}
              {liveCount > 0 && (
                <span className="ml-2 text-emerald-400">
                  · {liveCount} evento{liveCount > 1 ? 's' : ''} recebido{liveCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Carregando...
            </div>
          )}
        </div>

        {/* KPI Grid — 5 métricas principais */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <KPICard
            title="Leads Atendidos"
            value={metrics.totalLeads.toLocaleString('pt-BR')}
            subtitle={`${metrics.openConversations} abertos agora`}
            icon={<Users className="h-5 w-5" />}
            color="blue"
            pulse={metrics.openConversations > 0}
          />
          <KPICard
            title="Leads Qualificados"
            value={metrics.qualifiedLeads.toLocaleString('pt-BR')}
            subtitle={`${metrics.conversionRate}% de conversão`}
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
          />
          <KPICard
            title="Follow-up"
            value={metrics.followUpLeads.toLocaleString('pt-BR')}
            subtitle="aguardando retorno"
            icon={<RefreshCw className="h-5 w-5" />}
            color="yellow"
          />
          <KPICard
            title="Tempo de Resposta"
            value={formatDuration(metrics.avgResponseTimeSeconds)}
            subtitle="tempo médio IA"
            icon={<Clock className="h-5 w-5" />}
            color="purple"
          />
          <KPICard
            title="Espera p/ Atendente"
            value={formatDuration(metrics.avgWaitTimeSeconds)}
            subtitle="handoff → humano"
            icon={<UserCheck className="h-5 w-5" />}
            color="teal"
          />
        </div>

        {/* Linha de métricas secundárias */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Taxa de Qualificação
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{metrics.conversionRate}%</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${metrics.conversionRate}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Transferidos p/ Humano
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {metrics.transferredLeads.toLocaleString('pt-BR')}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              {metrics.totalLeads > 0
                ? `${Math.round((metrics.transferredLeads / metrics.totalLeads) * 100)}% do total`
                : '—'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Conversas Abertas
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {metrics.openConversations.toLocaleString('pt-BR')}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">em andamento agora</p>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Clientes Monitorados' : 'Sua Conta'}
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {isAdmin ? clients.length : (authClientName ?? user?.email?.split('@')[0] ?? '—')}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              {isAdmin ? 'agentes ativos' : 'acesso individual'}
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LeadsChart data={chartData} />
          </div>
          <div>
            <StatusDistribution conversations={conversations} />
          </div>
        </div>

        {/* Tabela de recentes */}
        <RecentLeadsTable conversations={conversations} />

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-600">
          <Activity className="h-3 w-3" />
          <span>Dados em tempo real via Supabase Realtime · n8n → Supabase</span>
        </div>
      </main>
    </div>
  )
}
