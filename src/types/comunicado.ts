/**
 * Tipos relacionados a comunicados, cardápio e seus anexos.
 */

import type { Shift } from './class'

export type AnnouncementScope =
  | 'turma'
  | 'turno'
  | 'escola'

export type AttachmentType =
  | 'imagem'
  | 'pdf'
  | 'outro'

export type Announcement = {
  id: string
  school_id: string
  title: string
  content: string
  scope: AnnouncementScope
  class_id: string | null
  shift: Shift | null
  published_by: string | null
  created_at: string
}

export type AnnouncementAttachment = {
  id: string
  announcement_id: string
  type: AttachmentType | null
  url: string
  file_name: string | null
  size_bytes: number | null
  display_order: number
  created_at: string
}

export type AnnouncementRead = {
  id: string
  announcement_id: string
  user_id: string
  read_at: string
}

export type Menu = {
  id: string
  school_id: string
  class_id: string | null
  week_start: string
  monday: string | null
  tuesday: string | null
  wednesday: string | null
  thursday: string | null
  friday: string | null
  created_by: string | null
  created_at: string
}