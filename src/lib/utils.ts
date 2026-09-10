import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalizeTitle(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .trim()
    .split(/(\s+)/)
    .map(segment => {
      // For each whitespace-separated word, also capitalize after / and -
      return segment.replace(/(^|[\/\-])([a-zA-Z])/g, (_, delim, char) => delim + char.toUpperCase());
    })
    .join("");
}
