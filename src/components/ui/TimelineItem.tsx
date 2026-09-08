/**
 * TimelineItem — daily routine item in the guardian's feed.
 * Shows colored icon + time + title + description + category badge.
 *
 * Can have expandable content for additional details.
 */

import { useState } from 'react'
import { Badge } from './Badge'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger'

type TimelineItemProps = {
  icon: string
  iconBg: string // icon background color
  time: string
  title: string
  description?: string
  badge?: {
    label: string
    variant: BadgeVariant
  }
  expandable?: boolean
  children?: React.ReactNode
}

export function TimelineItem({
  icon,
  iconBg,
  time,
  title,
  description,
  badge,
  expandable = false,
  children,
}: TimelineItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg bg-surface shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-fg2">{time}</p>
              <p className="text-sm font-semibold text-fg1">{title}</p>
            </div>
            {badge && <Badge label={badge.label} variant={badge.variant} />}
          </div>

          {description && <p className="mt-1 text-sm text-fg2 leading-relaxed">{description}</p>}
        </div>
      </div>

      {/* Expandable content */}
      {expandable && children && (
        <>
          <div className="mt-3 pt-3 border-t border-[#F0EAE4]">
            {open ? (
              children
            ) : (
              <button
                className="text-xs text-fg2 underline decoration-dotted"
                onClick={() => setOpen(true)}
              >
                ver detalhes →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
