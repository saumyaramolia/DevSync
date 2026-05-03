"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateDocumentTitle, deleteDocument } from "@/actions/document";
import { getDocumentRef } from "@/lib/firebase";
import { remove } from "firebase/database";

interface DocumentListItemProps {
  doc: {
    id: string;
    title: string;
    tags: string[];
    updatedAt: Date;
  };
  workspaceId: string;
}

export function DocumentListItem({ doc, workspaceId }: DocumentListItemProps) {
  const router = useRouter();

  async function handleRename() {
    const newTitle = window.prompt("New title:", doc.title);
    if (!newTitle?.trim() || newTitle.trim() === doc.title) return;
    await updateDocumentTitle(doc.id, newTitle.trim());
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    await Promise.all([
      deleteDocument(doc.id),
      remove(getDocumentRef(doc.id)),
    ]);
    router.refresh();
  }

  return (
    <li className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition hover:bg-slate-50">
      <Link
        href={`/workspace/${workspaceId}/document/${doc.id}`}
        className="flex min-w-0 flex-1 flex-col gap-1"
      >
        <span className="font-medium text-slate-900">{doc.title}</span>
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </Link>

      <div className="ml-4 flex shrink-0 items-center gap-3">
        <span className="text-xs text-slate-400">
          {formatDistanceToNow(doc.updatedAt, { addSuffix: true })}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Document actions"
          >
            <MoreHorizontalIcon className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={handleRename}>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} variant="destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
