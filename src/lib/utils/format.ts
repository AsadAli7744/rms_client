export const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: "Rs. ",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  SAR: "SAR ",
  INR: "₹",
  CAD: "CA$",
  AUD: "AU$",
};

export function getCurrencySymbol(currency?: string): string {
  if (!currency) return "Rs. ";
  const code = currency.trim().toUpperCase();
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency?: string,
): string {
  const num = typeof value === "string" ? parseFloat(value) || 0 : (value ?? 0);
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number, locale = "en-US") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(isoOrDate: string | Date, locale = "en-US") {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(isoOrDate: string | Date, locale = "en-US") {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function truncateText(text: string, max = 80) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
