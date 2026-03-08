'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  Shield,
  Plus,
  Users,
  Building2,
  LogOut,
  Bot,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react'

interface ClientUser {
  userId: string
  email: string
  role: string
}

interface Client {
  id: string
  name: string
  slug: string
  created_at: string
  users: ClientUser[]
}

export default function SuperAdminPage() {
  const { user, isSuperAdmin, isLoading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    clientName: '',
    clientSlug: '',
    userEmail: '',
    userPassword: '',
    userRole: 'viewer',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchClients = useCallback(async () => {
    setLoadingClients(true)
    const res = await fetch('/api/super-admin/clients')
    const data = await res.json()
    if (data.clients) setClients(data.clients)
    setLoadingClients(false)
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (!isSuperAdmin) router.push('/')
      else fetchClients()
    }
  }, [authLoading, isSuperAdmin, router, fetchClients])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    const res = await fetch('/api/super-admin/create-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (data.success) {
      setFeedback({ type: 'success', message: `Cliente "${form.clientName}" criado com sucesso!` })
      setForm({ clientName: '', clientSlug: '', userEmail: '', userPassword: '', userRole: 'viewer' })
      fetchClients()
    } else {
      setFeedback({ type: 'error', message: data.error ?? 'Erro desconhecido' })
    }
    setSubmitting(false)
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-violet-500" />
          <span className="text-sm">Verificando acesso...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Super Admin</h1>
                <p className="text-[10px] text-violet-400 leading-none">Painel de Controle</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </button>

              <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-medium text-white leading-none">{user?.email?.split('@')[0]}</p>
                  <p className="text-[9px] text-violet-400 leading-none mt-0.5">Super Admin</p>
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

      <main className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* FORMULÁRIO: Criar novo cliente */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20">
                <Plus className="h-4 w-4 text-violet-400" />
              </div>
              <h2 className="text-base font-semibold text-white">Criar Novo Cliente</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empresa Alpha"
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Slug (identificador único) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: empresa-alpha"
                  value={form.clientSlug}
                  onChange={(e) => setForm({ ...form, clientSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none font-mono"
                />
              </div>

              <div className="border-t border-slate-700/50 pt-4">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Usuário do Cliente (opcional)
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="contato@empresa.com.br"
                      value={form.userEmail}
                      onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Senha de acesso"
                        value={form.userPassword}
                        onChange={(e) => setForm({ ...form, userPassword: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pr-10 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Perfil
                    </label>
                    <select
                      value={form.userRole}
                      onChange={(e) => setForm({ ...form, userRole: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                    >
                      <option value="viewer">Viewer (somente leitura)</option>
                      <option value="admin">Admin (acesso total ao cliente)</option>
                    </select>
                  </div>
                </div>
              </div>

              {feedback && (
                <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                  feedback.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                }`}>
                  {feedback.type === 'success'
                    ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</>
                  : <><Plus className="h-4 w-4" /> Criar Cliente</>}
              </button>
            </form>
          </div>

          {/* LISTA: Clientes cadastrados */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20">
                  <Building2 className="h-4 w-4 text-blue-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Clientes Cadastrados</h2>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                {clients.length}
              </span>
            </div>

            {loadingClients ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="mb-3 h-10 w-10 text-slate-700" />
                <p className="text-sm text-slate-500">Nenhum cliente cadastrado ainda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clients.map((client) => (
                  <div key={client.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
                    <button
                      onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{client.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{client.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Users className="h-3 w-3" />
                          {client.users.length}
                        </span>
                        {expandedClient === client.id
                          ? <ChevronDown className="h-4 w-4 text-slate-500" />
                          : <ChevronRight className="h-4 w-4 text-slate-500" />}
                      </div>
                    </button>

                    {expandedClient === client.id && (
                      <div className="border-t border-slate-700/50 px-4 py-3">
                        {client.users.length === 0 ? (
                          <p className="text-[11px] text-slate-500">Sem usuários vinculados.</p>
                        ) : (
                          <div className="space-y-2">
                            {client.users.map((u) => (
                              <div key={u.userId} className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-300">{u.email}</span>
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                                  u.role === 'admin'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-slate-700 text-slate-400'
                                }`}>
                                  {u.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas gerais */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Total de Clientes</p>
            <p className="mt-1 text-2xl font-bold text-white">{clients.length}</p>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Total de Usuários</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {clients.reduce((acc, c) => acc + c.users.length, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Clientes c/ Usuários</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {clients.filter((c) => c.users.length > 0).length}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
