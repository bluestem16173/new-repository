import Link from "next/link";

/** Fallback if middleware is bypassed; primary redirect is in middleware. */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      <h1 className="text-xl font-semibold tracking-tight">MedIntel</h1>
      <p className="text-sm text-muted-foreground">
        Medical Affairs Intelligence demonstration
      </p>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[oklch(0.4_0.08_210)] underline-offset-4 hover:underline"
      >
        Continue to dashboard
      </Link>
    </main>
  );
}
