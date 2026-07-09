import axios from "axios";

/**
 * Extracts a user-facing message from an API error.
 * Backend wraps errors as `{ error: { data: { message } } }` (see itsyar_backend/app/main.py
 * exception handlers) — this checks that shape first, then falls back to other common shapes.
 */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Network error. Please check your connection and try again.";
    }

    const data = error.response.data as any;
    const message =
      data?.error?.data?.message ??
      data?.message ??
      data?.detail ??
      (Array.isArray(data?.errors) ? data.errors[0]?.message : undefined);

    if (typeof message === "string" && message.trim()) return message;
    return fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
