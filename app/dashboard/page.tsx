import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserWorkspaces } from "@/actions/workspace";
import { NewWorkspaceButton } from "@/components/new-workspace-button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const memberships = await getUserWorkspaces();

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {session.user.name ?? session.user.email}
          </p>
        </div>
        <NewWorkspaceButton />
      </div>

      {memberships.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <p className="text-sm font-medium text-slate-700">No workspaces yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Create your first workspace to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => (
            <Link key={m.workspace.id} href={`/workspace/${m.workspace.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{m.workspace.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {m.role} · Updated{" "}
                    {m.workspace.updatedAt.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
