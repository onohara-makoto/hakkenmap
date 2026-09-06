import type { ReactNode } from 'react'
import { Button } from './Button'

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
      {icon && (
        <div className="text-4xl" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-ink">{title}</p>
      {body && (
        <p className="text-sm text-ink-muted whitespace-pre-line max-w-xs">{body}</p>
      )}
      {action && (
        <div className="mt-2">
          <Button href={action.href} variant="primary">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
