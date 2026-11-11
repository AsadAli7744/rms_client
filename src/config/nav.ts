import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  UtensilsCrossed,
  Banknote,
  LayoutDashboard,
  QrCode,
  Layers,
  DoorOpen,
  Calendar,
  MapPin,
  ShieldCheck,
  Building2,
  Smartphone,
  Utensils,
  Package,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  match?: "prefix" | "exact";
  role?: string;
};

/** Branch-scoped paths use `:branchId` replaced at runtime. */
export const branchNav = (branchId: string | number): NavItem[] => [
  {
    title: "Item Sales Dashboard",
    href: `/branches/${branchId}/item-sales`,
    icon: BarChart3,
    match: "prefix",
  },
  {
    title: "Menu Items",
    href: `/branches/${branchId}/items`,
    icon: Utensils,
    match: "prefix",
    role: "manager",
  },
  {
    title: "Stock & Inventory",
    href: `/branches/${branchId}/stock`,
    icon: Package,
    match: "prefix",
    role: "manager",
  },
  {
    title: "Kitchen Display (KDS)",
    href: `/branches/${branchId}/kitchen`,
    icon: UtensilsCrossed,
    match: "prefix",
  },
  {
    title: "Cashier POS",
    href: `/branches/${branchId}/cashier`,
    icon: Banknote,
    match: "prefix",
  },
  {
    title: "Overview",
    href: `/branches/${branchId}`,
    icon: LayoutDashboard,
    match: "exact",
  },
  {
    title: "Tables & QR",
    href: `/branches/${branchId}/tables`,
    icon: QrCode,
    match: "prefix",
  },
  {
    title: "Floors",
    href: `/branches/${branchId}/floors`,
    icon: Layers,
    match: "prefix",
  },
  {
    title: "Halls",
    href: `/branches/${branchId}/halls`,
    icon: DoorOpen,
    match: "prefix",
  },
  {
    title: "Reservations",
    href: `/branches/${branchId}/reservations`,
    icon: Calendar,
    match: "prefix",
  },
  {
    title: "Seating map",
    href: `/branches/${branchId}/seating-map`,
    icon: MapPin,
    match: "prefix",
  },
];

export const topNav: NavItem[] = [
  {
    title: "SaaS Tenants",
    href: "/tenants",
    icon: ShieldCheck,
    match: "prefix",
    role: "admin",
  },
  {
    title: "Branches",
    href: "/branches",
    icon: Building2,
    match: "prefix",
  },
  {
    title: "Customer QR View",
    href: "/order?branchId=1&tableId=1",
    icon: Smartphone,
    match: "prefix",
  },
];
