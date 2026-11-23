/**
 * Hanya izinkan path internal. Menolak URL absolut, protocol-relative,
 * backslash, dan karakter kontrol.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/app",
): string {
  if (!next) return fallback;

  const trimmed = next.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("\\") || /[\u0000-\u001f]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
