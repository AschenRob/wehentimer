import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  actions?: ReactNode
  children: ReactNode
}

export function ChartCard({ title, actions, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-medium">{title}</h2>
        {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
