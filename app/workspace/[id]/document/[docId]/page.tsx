import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Editor } from "@/components/editor/Editor";
import { PresenceBar } from "@/components/editor/PresenceBar";
import { DocumentTitle } from "@/components/editor/DocumentTitle";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id: workspaceId, docId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc || doc.workspaceId !== workspaceId) notFound();

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId },
    },
  });
  if (!member) redirect("/dashboard");

  const currentUser = {
    id: session.user.id,
    name: session.user.name ?? session.user.email,
    image: session.user.image ?? undefined,
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-4">
        <DocumentTitle documentId={docId} initialTitle={doc.title} />
      </div>

      <div className="mb-6">
        <PresenceBar documentId={docId} currentUser={currentUser} />
      </div>

      <Editor
        documentId={docId}
        workspaceId={workspaceId}
        currentUser={currentUser}
      />
    </div>
  );
}
