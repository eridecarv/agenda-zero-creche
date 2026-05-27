/**
 * Ponto central de exportação de todos os tipos do projeto.
 * Importe sempre daqui: import type { Child, Class } from '@/types'
 */

export type { School, User, Role } from './school'

export type { Class, Shift, ClassType } from './class'

export type {
  Child,
  ChildClass,
  Guardianship,
  GuardianshipType,
  GuardianRelation,
} from './child'

export type {
  DailyLog,
  AttendanceLog,
  FeedingLog,
  HygieneLog,
  DailyReport,
  Mood,
  Sleep,
  Meal,
  Acceptance,
} from './routine'

export type {
  Incident,
  IncidentAttachment,
  IncidentRead,
  IncidentStatus,
} from './incident'

export type {
  Announcement,
  AnnouncementAttachment,
  AnnouncementRead,
  Menu,
  AnnouncementScope,
  AttachmentType,
} from './announcement'

export type { Invite } from './invite'

export type { Session, AuthResult } from './auth'

export type { Message } from './message'