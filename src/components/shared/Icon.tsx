import {
  Mail,
  Lock,
  ArrowRight,
  BarChart3,
  Zap,
  CheckCircle2,
  Reply,
  ReplyAll,
  NotebookPen,
  BellRing,
  PauseCircle,
  Copy,
  TriangleAlert,
  Check,
  FileText,
  Phone,
  MessageSquare,
  Users,
  GraduationCap,
  MailWarning,
  Megaphone,
  ClipboardCheck,
  Video,
  Hourglass,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react'

// Map the design-spec icon names (Material-style) to lucide icons, so call
// sites stay declarative and the icon set is swappable in one place.
const ICONS: Record<string, LucideIcon> = {
  mail: Mail,
  lock: Lock,
  arrow_forward: ArrowRight,
  analytics: BarChart3,
  bolt: Zap,
  check_circle: CheckCircle2,
  reply: Reply,
  reply_all: ReplyAll,
  edit_note: NotebookPen,
  notifications_active: BellRing,
  pause_circle: PauseCircle,
  content_copy: Copy,
  warning: TriangleAlert,
  check: Check,
  draft: FileText,
  call: Phone,
  chat: MessageSquare,
  groups: Users,
  school: GraduationCap,
  mark_email_unread: MailWarning,
  campaign: Megaphone,
  assignment_turned_in: ClipboardCheck,
  videocam: Video,
  hourglass_empty: Hourglass,
  light_mode: Sun,
  dark_mode: Moon,
}

interface IconProps {
  name: string
  className?: string
  /** ignored — kept for API compatibility with the previous font icon */
  filled?: boolean
  size?: number
}

export default function Icon({ name, className = '', size = 20 }: IconProps) {
  const Cmp = ICONS[name] ?? Mail
  return <Cmp className={`inline-block shrink-0 ${className}`} size={size} aria-hidden="true" />
}
