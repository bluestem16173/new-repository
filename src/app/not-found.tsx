import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The requested MedIntel page does not exist or the inquiry id is unknown.
      </p>
      <Button render={<Link href="/dashboard" />}>Return to dashboard</Button>
    </div>
  );
}
