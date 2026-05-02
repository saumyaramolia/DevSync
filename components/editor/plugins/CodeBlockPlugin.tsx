"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $findMatchingParent,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { CodeNode, $isCodeNode } from "@lexical/code";
import { registerCodeHighlighting } from "@lexical/code-prism";
import { CheckIcon, CopyIcon } from "lucide-react";

const LANGUAGES = [
  { value: "", label: "Plain text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
];

interface ToolbarState {
  key: string;
  language: string;
  top: number;
  right: number;
}

export function CodeBlockPlugin() {
  const [editor] = useLexicalComposerContext();
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Register Prism-based syntax highlighting
  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  const updateToolbar = useCallback(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) {
      setToolbar(null);
      return;
    }
    const codeNode = $findMatchingParent(
      sel.anchor.getNode(),
      $isCodeNode
    ) as CodeNode | null;
    if (!codeNode) {
      setToolbar(null);
      return;
    }
    const el = editor.getElementByKey(codeNode.getKey());
    if (!el) {
      setToolbar(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setToolbar({
      key: codeNode.getKey(),
      language: codeNode.getLanguage() ?? "",
      top: rect.top,
      right: window.innerWidth - rect.right,
    });
  }, [editor]);

  // Update toolbar position when editor state changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => updateToolbar());
    });
  }, [editor, updateToolbar]);

  // Re-position on scroll / resize
  useEffect(() => {
    const recalc = () => {
      editor.getEditorState().read(() => updateToolbar());
    };
    window.addEventListener("scroll", recalc, { passive: true });
    window.addEventListener("resize", recalc, { passive: true });
    return () => {
      window.removeEventListener("scroll", recalc);
      window.removeEventListener("resize", recalc);
    };
  }, [editor, updateToolbar]);

  function handleLanguageChange(language: string) {
    if (!toolbar) return;
    const { key } = toolbar;
    editor.update(() => {
      const node = $getNodeByKey(key);
      if ($isCodeNode(node)) node.setLanguage(language);
    });
    setToolbar((prev) => (prev ? { ...prev, language } : null));
  }

  function handleCopy() {
    if (!toolbar) return;
    const el = editor.getElementByKey(toolbar.key);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent ?? "").then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }

  if (!toolbar) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: toolbar.top,
        right: toolbar.right,
        zIndex: 50,
      }}
      className="flex items-center gap-2 rounded-tr-lg bg-zinc-800 border-b border-zinc-700 px-3 py-1.5"
      onMouseDown={(e) => e.preventDefault()}
    >
      <select
        value={toolbar.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-transparent text-xs text-zinc-400 outline-none hover:text-zinc-200 focus:text-zinc-200 cursor-pointer"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value} className="bg-zinc-800">
            {lang.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
      >
        {isCopied ? (
          <>
            <CheckIcon className="size-3" />
            Copied!
          </>
        ) : (
          <>
            <CopyIcon className="size-3" />
            Copy
          </>
        )}
      </button>
    </div>,
    document.body
  );
}
