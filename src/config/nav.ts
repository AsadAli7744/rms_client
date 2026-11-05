export type NavItem = {
  title: string;
  href: string;
  match?: "prefix" | "exact";
};

/** Branch-scoped paths use `:branchId` replaced at runtime. */
export const branchNav = (branchId: string | number): NavItem[] => [
  { title: "Item Sales Dashboard", href: `/branches/${branchId}/item-sales`, match: "prefix" },
  { title: "Kitchen Display (KDS)", href: `/branches/${branchId}/kitchen`, match: "prefix" },
  { title: "Cashier POS", href: `/branches/${branchId}/cashier`, match: "prefix" },
  { title: "Overview", href: `/branches/${branchId}`, match: "exact" },
  { title: "Tables & QR", href: `/branches/${branchId}/tables`, match: "prefix" },
  { title: "Floors", href: `/branches/${branchId}/floors`, match: "prefix" },
  { title: "Halls", href: `/branches/${branchId}/halls`, match: "prefix" },
  { title: "Reservations", href: `/branches/${branchId}/reservations`, match: "prefix" },
  { title: "Seating map", href: `/branches/${branchId}/seating-map`, match: "prefix" },
];

export const topNav: NavItem[] = [
  { title: "Branches", href: "/branches", match: "prefix" },
  { title: "Customer QR View", href: "/order?branchId=1&tableId=1", match: "prefix" },
];
