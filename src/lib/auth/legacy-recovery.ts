/** Legacy implicit recovery links keep credentials in the fragment, never query params. */
export function parseLegacyRecoveryFragment(hash: string): {
  accessToken: string;
  refreshToken: string;
} | null {
  if (!hash.startsWith("#") || hash.length > 16_000) return null;
  const params = new URLSearchParams(hash.slice(1));
  if (params.getAll("type").length !== 1 || params.get("type") !== "recovery") return null;
  if (params.getAll("access_token").length !== 1 || params.getAll("refresh_token").length !== 1) return null;
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken || accessToken.length > 10_000 || refreshToken.length > 2048) return null;
  return { accessToken, refreshToken };
}
