"use client"

import BubbleMenuExt from "@tiptap/extension-bubble-menu"
import { Image } from "@tiptap/extension-image"
import { Placeholder } from "@tiptap/extensions"
import { Markdown } from "@tiptap/markdown"
import { Editor as EditorType, EditorContent, EditorContext, useEditor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { StarterKit } from "@tiptap/starter-kit"
import { useEffect, useMemo, useRef } from "react"
import {
  MentionableUser,
  editorMarkdownToLinearMarkdown,
  linearMarkdownToEditorMarkdown,
  parseWorkspaceUrlKeyFromIssueUrl,
} from "src/utils/linearMentions"
import { ImageUploadNode } from "src/webviews/components/Editor/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { BlockquoteButton } from "src/webviews/components/Editor/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "src/webviews/components/Editor/components/tiptap-ui/code-block-button"
import { HeadingDropdownMenu } from "src/webviews/components/Editor/components/tiptap-ui/heading-dropdown-menu"
import { LinkPopover } from "src/webviews/components/Editor/components/tiptap-ui/link-popover"
import { ListDropdownMenu } from "src/webviews/components/Editor/components/tiptap-ui/list-dropdown-menu"
import { MarkButton } from "src/webviews/components/Editor/components/tiptap-ui/mark-button"
import { Spacer } from "src/webviews/components/Editor/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "src/webviews/components/Editor/components/tiptap-ui-primitive/toolbar"
import { MAX_FILE_SIZE } from "src/webviews/components/Editor/lib/tiptap-utils"
import { useIssueContext } from "src/webviews/contexts/IssueContext"
import { useEditorThemeClass } from "src/webviews/hooks/useVsCodeTheme"

import { Details, DetailsContent, DetailsSummary } from "./markdownPlugins/DetailsPlugin"
import { createUserMentionExtension } from "./markdownPlugins/MentionPlugin"
import { Video } from "./markdownPlugins/VideosPlugin/VideoPlugin"
import { getImageFileToBase64 } from "./uploadImage"

import "src/webviews/components/Editor/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "src/webviews/components/Editor/components/tiptap-node/code-block-node/code-block-node.scss"
import "src/webviews/components/Editor/components/tiptap-node/heading-node/heading-node.scss"
import "src/webviews/components/Editor/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "src/webviews/components/Editor/components/tiptap-node/image-node/image-node.scss"
import "src/webviews/components/Editor/components/tiptap-node/list-node/list-node.scss"
import "src/webviews/components/Editor/components/tiptap-node/paragraph-node/paragraph-node.scss"

import "./markdownPlugins/DetailsPlugin/Details.scss"
import "./markdownPlugins/MentionPlugin/MentionList.scss"
// eslint-disable-next-line import/order
import "./Editor.scss"

export type EditorProps = {
  value?: string
  editable?: boolean
  placeholder?: string
  onChange?: (value: string) => void
  getEditor?: (editor: EditorType) => void
  className?: string
  style?: React.CSSProperties
  mentionable?: boolean
}

export function Editor(props: EditorProps) {
  const {
    value = "",
    editable = false,
    placeholder,
    onChange,
    getEditor,
    className,
    style,
    mentionable = false,
  } = props

  const { users, issue } = useIssueContext()
  const editorThemeClass = useEditorThemeClass()
  const workspaceUrlKey = parseWorkspaceUrlKeyFromIssueUrl(issue?.url)
  const mentionUsers: MentionableUser[] | undefined = mentionable ? users : undefined
  const enableMentions = mentionable && !!mentionUsers?.length && (editable || !!workspaceUrlKey)

  const toolbarRef = useRef<HTMLDivElement>(null)

  const mentionExtension = useMemo(
    () =>
      createUserMentionExtension({
        getUsers: () => mentionUsers ?? [],
        getWorkspaceUrlKey: () => workspaceUrlKey,
      }),
    [mentionUsers, workspaceUrlKey],
  )

  const editorContent = useMemo(() => {
    if (!enableMentions || !mentionUsers?.length || !value) {
      return value || undefined
    }

    return linearMarkdownToEditorMarkdown(value, mentionUsers) || undefined
  }, [enableMentions, mentionUsers, value])

  const extensions = useMemo(() => {
    const configuredExtensions = [
      Markdown,
      StarterKit.configure({
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
        gapcursor: false,
        horizontalRule: false,
      }),
      Video,
      Details,
      DetailsContent,
      DetailsSummary,
      Placeholder.configure({
        placeholder: ({ pos }) => {
          if (pos === 0) {
            return placeholder || ""
          }
          return ""
        },
      }),
      Image,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: (file) => getImageFileToBase64(file, 150 * 1000),
        onError: (error) => console.error("Upload failed:", error),
      }),
      BubbleMenuExt,
    ]

    if (enableMentions) {
      configuredExtensions.push(mentionExtension)
    }

    return configuredExtensions
  }, [enableMentions, mentionExtension, placeholder])

  const editor = useEditor({
    immediatelyRender: true,
    editorProps: {
      attributes: {
        autocomplete: "on",
        autocorrect: "on",
        autocapitalize: "off",
        class: "simple-editor",
      },
    },
    extensions,
    contentType: "markdown",
    content: editorContent,
    onUpdate: editable
      ? ({ editor: currentEditor }) => {
          const markdown = currentEditor.getMarkdown()
          const nextValue = enableMentions ? editorMarkdownToLinearMarkdown(markdown) : markdown
          onChange?.(nextValue)
        }
      : undefined,
    editable,
  })

  useEffect(() => {
    getEditor?.(editor)
  }, [editor, getEditor])

  return (
    <div className={`simple-editor-wrapper ${editorThemeClass} ${className || ""}`} style={style}>
      <EditorContext.Provider value={{ editor }}>
        <EditorContent editor={editor} role="presentation" className="simple-editor-content" />
        {editor && editable ? (
          <BubbleMenu
            editor={editor || undefined}
            options={{
              autoPlacement: true,
              offset: 8,
              shift: true,
              flip: true,
            }}
          >
            <Toolbar ref={toolbarRef}>
              <MainToolbarContent editor={editor} />
            </Toolbar>
          </BubbleMenu>
        ) : null}
      </EditorContext.Provider>
    </div>
  )
}

const MainToolbarContent = (props: { editor: EditorType }) => {
  const { editor } = props

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        maxWidth: "90vw",
        flexWrap: "wrap",
      }}
    >
      <Spacer />
      <ToolbarGroup>
        <HeadingDropdownMenu editor={editor} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu editor={editor} types={["bulletList", "orderedList", "taskList"]} />
        <BlockquoteButton editor={editor} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton editor={editor} type="bold" />
        <MarkButton editor={editor} type="italic" />
        <MarkButton editor={editor} type="strike" />
        <MarkButton editor={editor} type="underline" />
        <LinkPopover />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton editor={editor} type="code" />
        <CodeBlockButton editor={editor} />
      </ToolbarGroup>
      <Spacer />
    </div>
  )
}
