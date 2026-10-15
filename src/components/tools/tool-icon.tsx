import {
  ArrowLeftRight,
  Binary,
  CalendarClock,
  Code2,
  Fingerprint,
  FlaskConical,
  Globe2,
  KeyRound,
  Link2,
  MessageSquareWarning,
  Network,
  Regex,
  ShieldCheck,
  Tags,
  type LucideIcon,
} from "lucide-react";

/** Icons named in the tool registry (`ToolMeta.icon`). */
const ICONS: Record<string, LucideIcon> = {
  CalendarClock,
  Binary,
  FlaskConical,
  Link2,
  Network,
  KeyRound,
  Regex,
  Tags,
  ArrowLeftRight,
  Code2,
  MessageSquareWarning,
  Fingerprint,
  Globe2,
  ShieldCheck,
};

export function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? FlaskConical;
  return <Icon className={className} aria-hidden="true" />;
}
