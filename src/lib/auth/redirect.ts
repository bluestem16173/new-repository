/** Return only same-origin application destinations, excluding auth loops. */
export function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || /[\\\u0000-\u0020]/.test(value)) return "/dashboard";
  try {
    const base = new URL("https://medintel.invalid");
    const target = new URL(value, base);
    if (target.origin !== base.origin || /^\/(login|auth)(\/|$)/.test(target.pathname)) return "/dashboard";
    return target.pathname + target.search + target.hash;
  } catch {
    return "/dashboard";
  }
}
