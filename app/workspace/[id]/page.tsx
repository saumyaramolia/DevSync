import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDocumentsByWorkspace } from "@/actions/document";
import { NewDocumentButton } from "@/components/new-document-button";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  let documents;
  try {
    documents = await getDocumentsByWorkspace(id);
  } catch {
    notFound();
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <NewDocumentButton workspaceId={id} />
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <p className="text-sm font-medium text-slate-700">No documents yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Create your first document to get started.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/workspace/${id}/document/${doc.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">{doc.title}</span>
                <span className="text-xs text-slate-400">
                  {doc.updatedAt.toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
