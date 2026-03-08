'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Conversation } from '@/types/database'
import { formatDuration } from '@/lib/metrics'

interface RecentLeadsTableProps {
  conversations: Conversation[]
}

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  open: { label: 'Aberto', classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  attending: { label: 'Atendendo', classes: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  qualified: { label: 'Qualificado', classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  follow_up: { label: 'Follow-up', classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  transferred: { label: 'Transferido', classes: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  closed: { label: 'Encerrado', classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

export function RecentLeadsTable({ conversations }: RecentLeadsTableProps) {
  const recent = conversations.slice(0, 10)

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <div className="border-b border-slate-700/50 px-5 py-4">
        <h3 className="text-sm font-semibold text-white">Últimos Atendimentos</h3>
        <p className="text-xs text-slate-400">Atualizado em tempo real</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/30">
              <th className="px-5 py-3 text-left font-medium text-slate-400">Lead</th>
              <th className="px-3 py-3 text-left font-medium text-slate-400">Agente</th>
              <th className="px-3 py-3 text-left font-medium text-slate-400">Status</th>
              <th className="px-3 py-3 text-right font-medium text-slate-400">T. Resposta</th>
              <th className="px-3 py-3 text-right font-medium text-slate-400">T. Espera</th>
              <th className="px-5 py-3 text-right font-medium text-slate-400">Início</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  Nenhum atendimento encontrado
                </td>
              </tr>
            ) : (
              recent.map((conv) => {
                const responseTime =
                  conv.first_response_at
                    ? formatDuration(
                        Math.round(
                          (new Date(conv.first_response_at).getTime() -
                            new Date(conv.started_at).getTime()) /
                            1000
                        )
                      )
                    : '—'

                const waitTime =
                  conv.handoff_requested_at && conv.attendant_joined_at
                    ? formatDuration(
                        Math.round(
                          (new Date(conv.attendant_joined_at).getTime() -
                            new Date(conv.handoff_requested_at).getTime()) /
                            1000
                        )
                      )
                    : '—'

                const badge = STATUS_BADGE[conv.status] ?? STATUS_BADGE.closed
                const agentName = (conv.agents as { name?: string } | null)?.name ?? '—'

                return (
                  <tr
                    key={conv.id}
                    className="border-b border-slate-700/20 transition-colors hover:bg-slate-700/20"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-white">{conv.lead_name ?? 'Anônimo'}</div>
                      <div className="text-slate-500">{conv.lead_phone ?? ''}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-300 max-w-[120px] truncate">{agentName}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">{responseTime}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-300">{waitTime}</td>
                    <td className="px-5 py-3 text-right text-slate-400">
                      {formatDistanceToNow(new Date(conv.started_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
