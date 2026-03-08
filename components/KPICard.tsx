'use client'

import type { ReactNode } from 'react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'teal'
  trend?: { value: number; label: string }
  pulse?: boolean
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'bg-blue-500/20 text-blue-400',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  green: {
    bg: 'bg-emerald-500/10',
    icon: 'bg-emerald-500/20 text-emerald-400',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  yellow: {
    bg: 'bg-amber-500/10',
    icon: 'bg-amber-500/20 text-amber-400',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'bg-purple-500/20 text-purple-400',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/10',
  },
  red: {
    bg: 'bg-rose-500/10',
    icon: 'bg-rose-500/20 text-rose-400',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/10',
  },
  teal: {
    bg: 'bg-teal-500/10',
    icon: 'bg-teal-500/20 text-teal-400',
    border: 'border-teal-500/20',
    text: 'text-teal-400',
    glow: 'shadow-teal-500/10',
  },
}

export function KPICard({ title, value, subtitle, icon, color, trend, pulse }: KPICardProps) {
  const c = colorMap[color]

  return (
    <div
      className={`relative rounded-2xl border ${c.border} ${c.bg} p-5 shadow-lg ${c.glow} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      {pulse && (
        <span className="absolute top-4 right-4 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className={`mt-2 text-3xl font-bold text-white tabular-nums`}>{value}</p>
          {subtitle && (
            <p className={`mt-1 text-xs ${c.text} font-medium`}>{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-1 text-xs ${trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`flex-shrink-0 rounded-xl p-3 ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
