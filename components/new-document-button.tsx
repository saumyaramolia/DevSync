"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createDocument } from "@/actions/document";

export function NewDocumentButton({ workspaceId }: { workspaceId: string }) {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      await createDocument(workspaceId);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "Creating…" : "+ New Document"}
    </Button>
  );
}
