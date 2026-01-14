import { useEffect, useRef } from "react";

import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  MarkdownParser,
  MarkdownSerializer,
  schema as markdownSchema,
} from "prosemirror-markdown";
import { Schema } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { history } from "prosemirror-history";
import placeholderPlugin from "./plugins/placeholder";

import "prosemirror-view/style/prosemirror.css";
import "./IssueTitleInput.css";

export type TextEditorProps = {
  defaultValue?: string;
  onSave?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
};

const schema = new Schema({
  nodes: markdownSchema.spec.nodes,
  marks: markdownSchema.spec.marks,
});

const mdSerializer = new MarkdownSerializer(
  defaultMarkdownSerializer.nodes,
  defaultMarkdownSerializer.marks
);

const mdParser = new MarkdownParser(
  schema,
  defaultMarkdownParser.tokenizer,
  defaultMarkdownParser.tokens
);

export function IssueTitleInput(props: TextEditorProps) {
  const { defaultValue = "", onBlur, onFocus, onSave, placeholder } = props;

  const editorEl = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  function handleSave() {
    const value = mdSerializer.serialize(view.current!.state.doc);
    if (value !== defaultValue) {
      onSave?.(value);
    }
  }

  function handleFocus() {
    onFocus?.();
  }

  function handleBlur() {
    handleSave();
    onBlur?.();
  }

  useEffect(() => {
    const plugins = [
      placeholderPlugin(placeholder ?? "Issue title"),
      history(),
    ];

    const state = EditorState.create({
      schema,
      doc: mdParser.parse(defaultValue),
      plugins: plugins,
    });
    const currView = new EditorView(editorEl.current!, {
      state,
      editable() {
        return false;
      },
    });
    view.current = currView;
    view.current.dom.addEventListener("focus", handleFocus);
    view.current.dom.addEventListener("blur", handleBlur);
    return () => {
      view.current?.dom.removeEventListener("focus", handleFocus);
      view.current?.dom.removeEventListener("blur", handleBlur);
      currView.destroy();
    };
  }, []);

  return <div className="linear-issue-title-input" ref={editorEl} />;
}
