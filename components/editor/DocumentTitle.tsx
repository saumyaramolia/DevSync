"use client";

import { useState } from "react";
import { updateDocumentTitle } from "@/actions/document";

interface DocumentTitleProps {
  documentId: string;
  initialTitle: string;
}

export function DocumentTitle({ documentId, initialTitle }: DocumentTitleProps) {
  const [title, setTitle] = useState(initialTitle);

  async function handleBlur() {
    const trimmed = title.trim() || "Untitled Document";
    if (trimmed !== title) setTitle(trimmed);
    await updateDocumentTitle(documentId, trimmed);
  }

  return (
    <input
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleBlur}
      className="w-full bg-transparent text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-300 focus:outline-none"
      placeholder="Untitled Document"
    />
  );
}
