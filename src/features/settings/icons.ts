import {
  Award,
  Briefcase,
  Clock,
  Cloud,
  Code2,
  Database,
  FileText,
  GraduationCap,
  Handshake,
  Layers,
  Link2,
  Network,
  Rocket,
  Server,
  Shield,
  Star,
  Users,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Icons the admin can pick for Hire Me cards. Stored by name in settings JSON. */
export const SETTINGS_ICONS = {
  Handshake,
  Clock,
  Zap,
  FileText,
  Code2,
  Link2,
  Network,
  Layers,
  Briefcase,
  Database,
  Server,
  Cloud,
  Shield,
  Wrench,
  Rocket,
  Users,
  Star,
  Workflow,
  GraduationCap,
  Award,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof SETTINGS_ICONS;

export const ICON_NAMES = Object.keys(SETTINGS_ICONS) as [IconName, ...IconName[]];
