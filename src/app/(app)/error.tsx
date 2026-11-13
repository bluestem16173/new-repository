"use client";

export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8" role="alert">
      <h1 className="text-2xl font-semibold">Workflow unavailable</h1>
      <p>Access or data could not be verified. Check your session, organization membership, and database configuration. Some workflows currently require an isolated synthetic demonstration environment.</p>
      <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={retry}>Try again</button>
      <a className="ml-4 underline" href="/login">Return to sign in</a>
    </main>
  );
}
