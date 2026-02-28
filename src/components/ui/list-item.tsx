"use client"

import * as React from "react"
import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

/* ─────────────────────────────────────────────
   List Item Layout (slot-based)
   ┌──────────────────────────────────────────┐
   │ [Leading]  Default Slot      [Trailing]  │
   │            Secondary Slot    (badge or    │
   │            Metadata Slot      text)       │
   └──────────────────────────────────────────┘
   ───────────────────────────────────────────── */

export interface ListItemTrailingSlot {
  is_badge: boolean
  text: string
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export interface ListItemData {
  id?: string
  /** Leading slot – rendered as an icon or short text in a square */
  leading_slot?: string | { type: "text" | "icon"; value: string }
  /** Primary text */
  default_slot: string
  /** Secondary descriptive text */
  secondary_slot?: string
  /** Extra metadata (e.g. time) shown on the trailing side */
  metadata_slot?: string
  /** Trailing slot – badge or plain text */
  trailing_slot?: ListItemTrailingSlot | string
}

export interface ListProps {
  title?: string
  items: ListItemData[]
  className?: string
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  AlertCircle,
}

function resolveLeadingSlot(slot: ListItemData["leading_slot"]) {
  if (!slot) return null

  // Simple string → treat as short text
  if (typeof slot === "string") {
    return (
      <span className="text-[10px] font-bold tracking-tight">{slot}</span>
    )
  }

  if (slot.type === "icon") {
    const Icon = ICON_MAP[slot.value]
    return Icon ? <Icon size={16} /> : <span>{slot.value}</span>
  }

  return (
    <span className="text-[10px] font-bold tracking-tight">{slot.value}</span>
  )
}

export function ListItem({ item }: { item: ListItemData }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all duration-200">
      {/* Left side: leading + text slots */}
      <div className="flex items-center gap-3 min-w-0">
        {item.leading_slot && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
            {resolveLeadingSlot(item.leading_slot)}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {item.default_slot}
          </div>
          {item.secondary_slot && (
            <div className="text-xs text-muted-foreground truncate">
              {item.secondary_slot}
            </div>
          )}
        </div>
      </div>

      {/* Right side: metadata + trailing */}
      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
        {item.metadata_slot && (
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {item.metadata_slot}
          </span>
        )}
        {item.trailing_slot &&
          (typeof item.trailing_slot === "object" &&
          item.trailing_slot.is_badge ? (
            <Badge
              variant={
                (item.trailing_slot.variant as
                  | "default"
                  | "secondary"
                  | "destructive"
                  | "outline") ?? "default"
              }
            >
              {item.trailing_slot.text}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {typeof item.trailing_slot === "string"
                ? item.trailing_slot
                : item.trailing_slot.text}
            </span>
          ))}
      </div>
    </div>
  )
}

export function List({ title, items, className }: ListProps) {
  return (
    <div className={cn("mt-4", className)}>
      {title && (
        <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      )}
      <div className="space-y-2">
        {items.map((item, i) => (
          <ListItem key={item.id || i} item={item} />
        ))}
      </div>
    </div>
  )
}
