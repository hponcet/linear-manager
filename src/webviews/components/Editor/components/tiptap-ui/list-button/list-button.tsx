import { forwardRef, useCallback } from "react"
import {
  LIST_SHORTCUT_KEYS,
  useList,
} from "src/webviews/components/Editor/components/tiptap-ui/list-button"
import { Badge } from "src/webviews/components/Editor/components/tiptap-ui-primitive/badge"
import { Button } from "src/webviews/components/Editor/components/tiptap-ui-primitive/button"
import { useTiptapEditor } from "src/webviews/components/Editor/hooks/use-tiptap-editor"
import { parseShortcutKeys } from "src/webviews/components/Editor/lib/tiptap-utils"

import type {
  ListType,
  UseListConfig,
} from "src/webviews/components/Editor/components/tiptap-ui/list-button"
import type { ButtonProps } from "src/webviews/components/Editor/components/tiptap-ui-primitive/button"

export interface ListButtonProps extends Omit<ButtonProps, "type">, UseListConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean
}

export function ListShortcutBadge({
  type,
  shortcutKeys = LIST_SHORTCUT_KEYS[type],
}: {
  type: ListType
  shortcutKeys?: string
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>
}

/**
 * Button component for toggling lists in a Tiptap editor.
 *
 * For custom button implementations, use the `useList` hook instead.
 */
export const ListButton = forwardRef<HTMLButtonElement, ListButtonProps>(
  (
    {
      editor: providedEditor,
      type,
      text,
      hideWhenUnavailable = false,
      onToggled,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { isVisible, canToggle, isActive, handleToggle, label, shortcutKeys, Icon } = useList({
      editor,
      type,
      hideWhenUnavailable,
      onToggled,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleToggle()
      },
      [handleToggle, onClick],
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        role="button"
        tabIndex={-1}
        disabled={!canToggle}
        data-disabled={!canToggle}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <Icon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
            {showShortcut && <ListShortcutBadge type={type} shortcutKeys={shortcutKeys} />}
          </>
        )}
      </Button>
    )
  },
)

ListButton.displayName = "ListButton"
