import {
  Activity,
  BrainCircuit,
  CalendarRange,
  Footprints,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Zap,
} from "lucide-react";

export interface NavItem {
  to: "/" | "/daily" | "/gait" | "/energy" | "/reports" | "/ai-summary" | "/data-quality" | "/settings";
  label: string;
  description: string;
  icon: typeof Activity;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", description: "Overview & KPIs", icon: LayoutDashboard },
  { to: "/daily", label: "Daily Analytics", description: "Per-day records", icon: CalendarRange },
  { to: "/gait", label: "Gait Analysis", description: "Trends & comparison", icon: Footprints },
  { to: "/energy", label: "Energy Analytics", description: "Harvesting & power", icon: Zap },
  { to: "/reports", label: "Patient Reports", description: "Self-reported scores", icon: Activity },
  { to: "/ai-summary", label: "AI Clinical Summary", description: "Rule-based, multilingual", icon: BrainCircuit },
  { to: "/data-quality", label: "Data Quality", description: "Device & sensor status", icon: ShieldCheck },
  { to: "/settings", label: "Settings / System", description: "Hardware & roadmap", icon: Settings },
];
