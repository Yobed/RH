import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a YYYY-MM-DD date string to a localized date string
 * parsing it locally to avoid UTC timezone shifts that move the day back by 1.
 */
export function formatDateLocal(dateString: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }, locale = "fr-CI") {
  if (!dateString) return "—";
  try {
    const [y, m, dStr] = dateString.split("T")[0].split("-");
    if (!y || !m || !dStr) return new Date(dateString).toLocaleDateString(locale, options);
    const d = dStr.substring(0, 2);
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return date.toLocaleDateString(locale, options);
  } catch {
    return new Date(dateString).toLocaleDateString(locale, options);
  }
}
