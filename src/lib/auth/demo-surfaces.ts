/**
 * Illustrative demo surfaces shared by the edge proxy and Auth UX.
 * Keep Demo / Illustrative labels on these routes.
 */
export const DEMO_SURFACE_PATHS = [
  "/workflow-studio",
  "/data-room",
  "/agents",
] as const;

export function isDemoSurfacePath(pathname: string): boolean {
  return DEMO_SURFACE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
