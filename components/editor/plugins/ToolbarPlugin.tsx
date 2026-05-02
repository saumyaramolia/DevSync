"use client";

import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND, $getSelection, $isRangeSelection } from "lexical";
import { Button } from "@/components/ui/button";
import { BoldIcon, ItalicIcon, StrikethroughIcon } from "lucide-react";

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrike, setIsStrike] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsStrike(selection.hasFormat("strikethrough"));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => updateToolbar());
    });
  }, [editor, updateToolbar]);

  return (
    <div className="flex gap-1 border-b border-slate-200 p-2">
      <Button
        size="icon-sm"
        variant={isBold ? "secondary" : "ghost"}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        aria-label="Bold"
      >
        <BoldIcon className="size-3.5" />
      </Button>
      <Button
        size="icon-sm"
        variant={isItalic ? "secondary" : "ghost"}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        aria-label="Italic"
      >
        <ItalicIcon className="size-3.5" />
      </Button>
      <Button
        size="icon-sm"
        variant={isStrike ? "secondary" : "ghost"}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        aria-label="Strikethrough"
      >
        <StrikethroughIcon className="size-3.5" />
      </Button>
    </div>
  );
}
