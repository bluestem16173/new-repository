import { DemoUserSwitcher } from "@/components/settings/demo-user-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABELS } from "@/domain/authorization";
import { renderAppPage } from "@/lib/page";
import { getCurrentUser, listDemoUsers } from "@/lib/session";
import { getRuntimeMode } from "@/lib/supabase/env";

export default async function SettingsPage() {
  const [user, mode, demoUsers] = await Promise.all([
    getCurrentUser(),
    Promise.resolve(getRuntimeMode()),
    listDemoUsers(),
  ]);

  return renderAppPage(
    "Settings",
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Runtime</CardTitle>
          <CardDescription>
            Persistence depends on Supabase environment configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Mode:{" "}
            <span className="font-medium">
              {mode === "demo" ? "Demo (in-memory)" : "Supabase"}
            </span>
          </p>
          <p>
            Current user:{" "}
            <span className="font-medium">
              {user.fullName} ({ROLE_LABELS[user.role]})
            </span>
          </p>
          {mode === "demo" ? (
            <p className="text-amber-900">
              Demo changes are not written to a database and reset when the
              server process restarts.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
              and server-only SUPABASE_SERVICE_ROLE_KEY. Never expose the service
              role to the browser.
            </p>
          )}
        </CardContent>
      </Card>

      {mode === "demo" ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Demo identity</CardTitle>
            <CardDescription>
              Switch roles to exercise authorization rules (approve requires
              medical_reviewer or admin).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DemoUserSwitcher users={demoUsers} currentUserId={user.id} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Security notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>No real patient or PHI data should be entered.</p>
          <p>
            Server-side authorization guards mutations; database RLS reinforces
            approve-only roles.
          </p>
          <p>
            AI medical response generation is intentionally not auto-released in
            Phase 1.
          </p>
        </CardContent>
      </Card>
    </div>,
  );
}
