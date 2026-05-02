"use client";

import { useCallback, useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { HorizontalRuleNode } from "@lexical/extension";
import type { EditorState } from "lexical";
import { child, get, onValue, set } from "firebase/database";

import { getDocumentRef } from "@/lib/firebase";
import { theme } from "@/components/editor/theme";
import { ToolbarPlugin } from "@/components/editor/plugins/ToolbarPlugin";
import { SlashCommandPlugin } from "@/components/editor/plugins/SlashCommandPlugin";
import { CodeBlockPlugin } from "@/components/editor/plugins/CodeBlockPlugin";

interface EditorProps {
  documentId: string;
  workspaceId: string;
  currentUser: { id: string; name: string; image?: string };
}

function FirebaseSyncPlugin({
  documentId,
  currentUser,
}: {
  documentId: string;
  currentUser: { id: string; name: string; image?: string };
}) {
  const [editor] = useLexicalComposerContext();
  const isRemoteUpdate = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  // Counts our own writes that are still in-flight so we can skip their echo.
  // Firebase reorders object keys alphabetically, so string comparison of
  // lastWritten vs snap.val() is unreliable — a counter is the safe alternative.
  const pendingWrites = useRef(0);

  // Load initial content from Firebase
  useEffect(() => {
    get(child(getDocumentRef(documentId), "content"))
      .then((snap) => {
        const content = snap.val();
        // Only attempt to parse if it looks like Lexical JSON (has a 'root' key).
        // ProseMirror / TipTap JSON has 'type:"doc"' instead — passing it to
        // parseEditorState triggers onError even if we catch the throw.
        if (!content || typeof content !== "object" || !("root" in content))
          return;
        try {
          isRemoteUpdate.current = true;
          editor.setEditorState(editor.parseEditorState(content));
        } catch {
          // Incompatible schema — start with an empty editor
        } finally {
          isRemoteUpdate.current = false;
        }
      })
      .catch((err) => console.error("[Firebase] read/content failed:", err));
  }, [editor, documentId]);

  // Subscribe to real-time remote changes from other collaborators
  useEffect(() => {
    const contentRef = child(getDocumentRef(documentId), "content");
    const unsub = onValue(contentRef, (snap) => {
      const remote = snap.val();
      if (!remote) return;

      // Our own write echoing back — skip it and decrement the counter
      if (pendingWrites.current > 0) {
        pendingWrites.current--;
        return;
      }

      // Guard: must be Lexical JSON before we attempt to parse
      if (typeof remote !== "object" || !("root" in remote)) return;

      // Normalise both sides through parseEditorState so key-ordering
      // differences introduced by Firebase are eliminated before comparing.
      let remoteNorm: string;
      try {
        remoteNorm = JSON.stringify(editor.parseEditorState(remote).toJSON());
      } catch {
        return; // Unrecognised schema — ignore silently
      }

      if (remoteNorm === JSON.stringify(editor.getEditorState().toJSON()))
        return; // Already up to date

      isRemoteUpdate.current = true;
      try {
        editor.setEditorState(editor.parseEditorState(remote));
      } catch {
        // Incompatible remote state
      } finally {
        isRemoteUpdate.current = false;
      }
    });
    return () => unsub();
  }, [editor, documentId]);

  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (isRemoteUpdate.current) return;
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        // JSON round-trip removes any non-plain-object prototypes that would
        // crash Firebase's hasOwnProperty check
        const plain = JSON.parse(
          JSON.stringify(editorState.toJSON())
        ) as object;
        const docRef = getDocumentRef(documentId);
        // Increment BEFORE the set() so the counter is already > 0 when the
        // onValue echo arrives (Firebase can respond faster than our .then()).
        pendingWrites.current++;
        set(child(docRef, "content"), plain).catch((err) => {
          // Write failed — roll back the counter so future remote updates aren't blocked
          pendingWrites.current = Math.max(0, pendingWrites.current - 1);
          console.error("[Firebase] write/content failed:", err);
        });
        set(child(docRef, "lastEditedBy"), {
          userId: currentUser.id,
          timestamp: Date.now(),
        }).catch((err) =>
          console.error("[Firebase] write/lastEditedBy failed:", err)
        );
      }, 300);
    },
    [documentId, currentUser.id]
  );

  return <OnChangePlugin onChange={handleChange} ignoreSelectionChange />;
}

export function Editor({ documentId, currentUser }: EditorProps) {
  const initialConfig = {
    namespace: "DevSyncEditor",
    theme,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      HorizontalRuleNode,
    ],
    onError: (error: Error) => console.error("[Lexical]", error),
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="prose prose-slate max-w-none p-6 outline-none min-h-[60vh]" />
            }
            placeholder={
              <div className="pointer-events-none absolute top-6 left-6 text-slate-400 select-none">
                Start writing, or press &apos;/&apos; for commands…
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <SlashCommandPlugin />
          <CodeBlockPlugin />
          <FirebaseSyncPlugin
            documentId={documentId}
            currentUser={currentUser}
          />
        </div>
      </div>
    </LexicalComposer>
  );
}
