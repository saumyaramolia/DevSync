"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createWorkspace } from "@/actions/workspace";

export function NewWorkspaceButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    const name = window.prompt("Workspace name:");
    if (!name?.trim()) return;
    setIsPending(true);
    try {
      await createWorkspace(name.trim());
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "Creating…" : "+ New Workspace"}
    </Button>
  );
}
