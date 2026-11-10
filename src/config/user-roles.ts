import type { UserRole } from "@/lib/auth/auth-context";

export interface RoleConfig {
  key: UserRole;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  borderClass: string;
  description: string;
  defaultRoute: (branchId?: number | string | null) => string;
}

export const USER_ROLES_CONFIG: Record<UserRole, RoleConfig> = {
  admin: {
    key: "admin",
    title: "SaaS Platform Owner",
    badgeLabel: "SaaS Owner",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    borderClass: "border-purple-500/30 hover:border-purple-500/60",
    description: "Oversee all restaurant tenants, platform billing, global metrics & infrastructure.",
    defaultRoute: () => "/select-role",
  },
  manager: {
    key: "manager",
    title: "Restaurant Owner / Manager",
    badgeLabel: "Restaurant Owner",
    badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    borderClass: "border-blue-500/30 hover:border-blue-500/60",
    description: "Branch operations, item sales analytics, staff, tables, floor layout & discounts.",
    defaultRoute: (branchId) => `/branches/${branchId || 1}/item-sales`,
  },
  cashier: {
    key: "cashier",
    title: "Cashier Staff",
    badgeLabel: "Cashier POS",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    borderClass: "border-emerald-500/30 hover:border-emerald-500/60",
    description: "Take orders at POS counter, manage 1-order-per-table queue, apply discounts & checkout.",
    defaultRoute: (branchId) => `/branches/${branchId || 1}/cashier`,
  },
  kitchen: {
    key: "kitchen",
    title: "Kitchen Staff",
    badgeLabel: "Kitchen KDS",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    borderClass: "border-orange-500/30 hover:border-orange-500/60",
    description: "Live Kitchen Display System (KDS), thermal auto-printing & real-time ticket progression.",
    defaultRoute: (branchId) => `/branches/${branchId || 1}/kitchen`,
  },
  waiter: {
    key: "waiter",
    title: "Floor Waiter",
    badgeLabel: "Floor Waiter",
    badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    borderClass: "border-teal-500/30 hover:border-teal-500/60",
    description: "Dine-in table order creation, customer table assistance & menu ordering.",
    defaultRoute: (branchId) => `/branches/${branchId || 1}/cashier`,
  },
};
