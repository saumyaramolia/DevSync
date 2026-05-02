"use client";

import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $getSelection, $isRangeSelection, type LexicalEditor } from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, type HeadingTagType } from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/extension";

interface CommandDef {
  label: string;
  description: string;
  runAction: (editor: LexicalEditor) => void;
}

const COMMANDS: CommandDef[] = [
  {
    label: "Heading 1",
    description: "Large section heading",
    runAction: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel))
          $setBlocksType(sel, () => $createHeadingNode("h1" as HeadingTagType));
      }),
  },
  {
    label: "Heading 2",
    description: "Medium section heading",
    runAction: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel))
          $setBlocksType(sel, () => $createHeadingNode("h2" as HeadingTagType));
      }),
  },
  {
    label: "Heading 3",
    description: "Small section heading",
    runAction: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel))
          $setBlocksType(sel, () => $createHeadingNode("h3" as HeadingTagType));
      }),
  },
  {
    label: "Code Block",
    description: "Syntax highlighted code",
    runAction: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel))
          $setBlocksType(sel, () => $createCodeNode());
      }),
  },
  {
    label: "Bullet List",
    description: "Unordered list",
    runAction: (editor) =>
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    label: "Numbered List",
    description: "Ordered list",
    runAction: (editor) =>
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    label: "Divider",
    description: "Horizontal rule",
    runAction: (editor) =>
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
];

class SlashOption extends MenuOption {
  description: string;
  runAction: (editor: LexicalEditor) => void;

  constructor(cmd: CommandDef) {
    super(cmd.label);
    this.description = cmd.description;
    this.runAction = cmd.runAction;
  }
}

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForSlash = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
    maxLength: 30,
  });

  const options = useMemo(() => {
    const q = (queryString ?? "").toLowerCase();
    return COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(q)).map(
      (cmd) => new SlashOption(cmd)
    );
  }, [queryString]);

  const onSelectOption = useCallback(
    (
      option: SlashOption,
      textNode: Parameters<
        React.ComponentProps<
          typeof LexicalTypeaheadMenuPlugin
        >["onSelectOption"]
      >[1],
      closeMenu: () => void
    ) => {
      // Remove the "/" + query text, then run the block transform
      editor.update(() => {
        if (textNode) textNode.remove();
      });
      option.runAction(editor);
      closeMenu();
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      options={options}
      triggerFn={checkForSlash}
      preselectFirstItem
      menuRenderFn={(anchorRef, { selectedIndex, selectOptionAndCleanUp }) =>
        anchorRef.current && options.length > 0
          ? createPortal(
              <div className="z-50 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {options.map((opt, i) => (
                  <button
                    key={opt.key}
                    ref={opt.setRefElement}
                    className={`flex w-full flex-col px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                      i === (selectedIndex ?? 0) ? "bg-slate-100" : ""
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOptionAndCleanUp(opt);
                    }}
                  >
                    <span className="font-medium text-slate-900">{opt.key}</span>
                    <span className="text-xs text-slate-400">
                      {opt.description}
                    </span>
                  </button>
                ))}
              </div>,
              anchorRef.current
            )
          : null
      }
    />
  );
}
