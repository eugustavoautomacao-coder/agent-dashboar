'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Conversation } from '@/types/database'

interface StatusDistributionProps {
  conversations: Conversation[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Aberto', color: '#3b82f6' },
  attending: { label: 'Em Atendimento', color: '#8b5cf6' },
  qualified: { label: 'Qualificado', color: '#10b981' },
  follow_up: { label: 'Follow-up', color: '#f59e0b' },
  transferred: { label: 'Transferido', color: '#06b6d4' },
  closed: { label: 'Encerrado', color: '#64748b' },
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl">
      <p className="text-xs font-semibold text-white">{payload[0].name}</p>
      <p className="text-xs text-slate-300">{payload[0].value} leads</p>
    </div>
  )
}

export function StatusDistribution({ conversations }: StatusDistributionProps) {
  const counts = conversations.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  const data = Object.entries(counts)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label ?? status,
      value: count,
      color: STATUS_CONFIG[status]?.color ?? '#64748b',
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 text-sm">
        Sem dados
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Distribuição por Status</h3>
        <p className="text-xs text-slate-400">{conversations.length} conversas totais</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
