import {
  LayoutDashboard,
  TrendingUp,
  MapPinned,
  AlertTriangle,
  Truck,
  CloudRain,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Command Center", icon: LayoutDashboard },
      { to: "/analytics", label: "Accident Analytics", icon: TrendingUp },
      { to: "/hotspots", label: "Hotspot Map", icon: MapPinned, badge: "127" },
    ],
  },
  {
    title: "Deep analysis",
    items: [
      { to: "/causes", label: "Cause Analysis", icon: AlertTriangle },
      { to: "/vehicles", label: "Vehicle-wise", icon: Truck },
      { to: "/conditions", label: "Weather & Road", icon: CloudRain },
    ],
  },
  {
    title: "Output",
    items: [{ to: "/reports", label: "Reports", icon: FileBarChart }],
  },
];