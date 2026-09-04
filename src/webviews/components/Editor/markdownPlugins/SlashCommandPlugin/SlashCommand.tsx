import { Extension } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"
import { ReactRenderer } from "@tiptap/react"
import { Suggestion } from "@tiptap/suggestion"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { ChevronDownIcon } from "src/webviews/components/Editor/components/tiptap-icons/chevron-down-icon"
import {
  Button,
  ButtonGroup,
} from "src/webviews/components/Editor/components/tiptap-ui-primitive/button"
import { Card, CardBody } from "src/webviews/components/Editor/components/tiptap-ui-primitive/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/webviews/components/Editor/components/tiptap-ui-primitive/dropdown-menu"

import type { LinearEditorCommand } from "./linearEditorCommands"
import type { Editor } from "@tiptap/core"
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion"

export { createLinearEditorCommands } from "./linearEditorCommands"
export type { LinearEditorCommand } from "./linearEditorCommands"

export type SlashCommandListRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

export function LinearEditorCommandMenu(props: {
  commands: LinearEditorCommand[]
  editor: Editor
}) {
  const { commands, editor } = props
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          tabIndex={-1}
          aria-label="Editor commands"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return
            event.preventDefault()
            setOpen(true)
          }}
        >
          <span>Commands</span>
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" data-linear-editor-ui="">
        <Card>
          <CardBody>
            <ButtonGroup>
              {commands.map((command) => (
                <DropdownMenuItem key={command.id} asChild>
                  <Button
                    type="button"
                    data-style="ghost"
                    showTooltip={false}
                    onClick={() => command.run(editor)}
                  >
                    {command.label}
                  </Button>
                </DropdownMenuItem>
              ))}
            </ButtonGroup>
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SlashCommandList = forwardRef<SlashCommandListRef, SuggestionProps<LinearEditorCommand>>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => setSelectedIndex(0), [props.items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (!props.items.length) return false
        if (event.key === "ArrowUp") {
          setSelectedIndex((current) => (current + props.items.length - 1) % props.items.length)
          return true
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((current) => (current + 1) % props.items.length)
          return true
        }
        if (event.key === "Enter") {
          props.command(props.items[selectedIndex])
          return true
        }
        return false
      },
    }))

    return (
      <div className="linear-slash-menu" role="listbox" aria-label="Editor commands">
        {props.items.length ? (
          props.items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              className={index === selectedIndex ? "is-selected" : undefined}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault()
                props.command(item)
              }}
            >
              {item.label}
            </button>
          ))
        ) : (
          <span className="linear-slash-menu-empty">No commands found</span>
        )}
      </div>
    )
  },
)

SlashCommandList.displayName = "SlashCommandList"

export function createSlashCommand(commands: LinearEditorCommand[]) {
  return Extension.create({
    name: "linearSlashCommand",
    addProseMirrorPlugins() {
      return [
        Suggestion<LinearEditorCommand, LinearEditorCommand>({
          editor: this.editor,
          pluginKey: new PluginKey("linearSlashCommand"),
          char: "/",
          // Linear opens its command menu wherever the caret is, so the commands stay reachable
          // without a selection. @tiptap/suggestion's default `allowedPrefixes: [" "]` still
          // keeps "and/or", "9/3" and "src/foo" from triggering it.
          startOfLine: false,
          items: ({ query }) => {
            const normalized = query.trim().toLowerCase()
            return commands
              .filter(
                (item) =>
                  !normalized ||
                  item.label.toLowerCase().includes(normalized) ||
                  item.keywords.some((keyword) => keyword.includes(normalized)),
              )
              .slice(0, 10)
          },
          command: ({ editor, range, props }) => props.run(editor, range),
          render: () => {
            let component: ReactRenderer<SlashCommandListRef> | null = null

            const position = (clientRect?: (() => DOMRect | null) | null) => {
              const element = component?.element as HTMLElement | undefined
              const rect = clientRect?.()
              if (!element || !rect) return
              element.style.position = "fixed"
              element.style.left = `${rect.left}px`
              element.style.top = `${rect.bottom + 4}px`
              element.style.zIndex = "1000"
            }

            return {
              onStart: (props) => {
                component = new ReactRenderer(SlashCommandList, {
                  props,
                  editor: props.editor,
                })
                document.body.appendChild(component.element)
                position(props.clientRect)
              },
              onUpdate: (props) => {
                component?.updateProps(props)
                position(props.clientRect)
              },
              onKeyDown: (props) => {
                if (props.event.key === "Escape") return true
                return component?.ref?.onKeyDown(props) ?? false
              },
              onExit: () => {
                component?.element.remove()
                component?.destroy()
                component = null
              },
            }
          },
        }),
      ]
    },
  })
}
