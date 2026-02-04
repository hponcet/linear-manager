"use client"

import { forwardRef, useCallback } from "react"
import {
  TEXT_ALIGN_SHORTCUT_KEYS,
  useTextAlign,
} from "src/webviews/components/Editor/components/tiptap-ui/text-align-button"
import { Badge } from "src/webviews/components/Editor/components/tiptap-ui-primitive/badge"
import { Button } from "src/webviews/components/Editor/components/tiptap-ui-primitive/button"
import { useTiptapEditor } from "src/webviews/components/Editor/hooks/use-tiptap-editor"
import { parseShortcutKeys } from "src/webviews/components/Editor/lib/tiptap-utils"

import type {
  TextAlign,
  UseTextAlignConfig,
} from "src/webviews/components/Editor/components/tiptap-ui/text-align-button"
import type { ButtonProps } from "src/webviews/components/Editor/components/tiptap-ui-primitive/button"

type IconProps = React.SVGProps<SVGSVGElement>
type IconComponent = ({ className, ...props }: IconProps) => React.ReactElement

export interface TextAlignButtonProps extends Omit<ButtonProps, "type">, UseTextAlignConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean
  /**
   * Optional custom icon component to render instead of the default.
   */
  icon?: React.MemoExoticComponent<IconComponent> | React.FC<IconProps>
}

export function TextAlignShortcutBadge({
  align,
  shortcutKeys = TEXT_ALIGN_SHORTCUT_KEYS[align],
}: {
  align: TextAlign
  shortcutKeys?: string
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>
}

/**
 * Button component for setting text alignment in a Tiptap editor.
 *
 * For custom button implementations, use the `useTextAlign` hook instead.
 */
export const TextAlignButton = forwardRef<HTMLButtonElement, TextAlignButtonProps>(
  (
    {
      editor: providedEditor,
      align,
      text,
      hideWhenUnavailable = false,
      onAligned,
      showShortcut = false,
      onClick,
      icon: CustomIcon,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { isVisible, handleTextAlign, label, canAlign, isActive, Icon, shortcutKeys } =
      useTextAlign({
        editor,
        align,
        hideWhenUnavailable,
        onAligned,
      })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleTextAlign()
      },
      [handleTextAlign, onClick],
    )

    if (!isVisible) {
      return null
    }

    const RenderIcon = CustomIcon ?? Icon

    return (
      <Button
        type="button"
        disabled={!canAlign}
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        data-disabled={!canAlign}
        role="button"
        tabIndex={-1}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <RenderIcon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
            {showShortcut && <TextAlignShortcutBadge align={align} shortcutKeys={shortcutKeys} />}
          </>
        )}
      </Button>
    )
  },
)

TextAlignButton.displayName = "TextAlignButton"
