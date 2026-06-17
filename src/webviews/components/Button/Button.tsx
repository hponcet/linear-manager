import cx from "classnames"
import { forwardRef, ReactNode, useState } from "react"
import { Loader, Button as RSButton, type ButtonProps as RSButtonProps } from "rsuite"

import { Tooltip } from "../Tooltip/Tooltip"

import "./Button.scss"

export type ButtonVariant = "default" | "primary" | "subtle" | "ghost" | "link" | "danger"

export type ButtonProps = Omit<RSButtonProps, "color"> & {
  children?: ReactNode
  tooltip?: ReactNode
  onClick?: () => void | Promise<void>
  disabled?: boolean
  /** @deprecated Prefer `appearance` or `variant` so VS Code theme tokens apply. */
  color?: string
  variant?: ButtonVariant
  iconOnly?: boolean
  round?: boolean
  rounded?: boolean
  loading?: boolean
  icon?: ReactNode
}

function resolveAppearance(
  variant: ButtonVariant | undefined,
  appearance: RSButtonProps["appearance"],
  isIconOnly: boolean,
): RSButtonProps["appearance"] {
  if (appearance) {
    return appearance
  }

  if (variant) {
    switch (variant) {
      case "primary":
        return "primary"
      case "subtle":
        return "subtle"
      case "ghost":
        return "ghost"
      case "link":
        return "link"
      case "danger":
      case "default":
        return "default"
    }
  }

  if (isIconOnly) {
    return "subtle"
  }

  return "default"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    children,
    tooltip,
    onClick,
    disabled,
    className,
    color,
    variant,
    iconOnly,
    round,
    rounded,
    style,
    loading,
    icon,
    appearance,
    size,
    ...buttonProps
  } = props

  const [isActionLoading, setIsActionLoading] = useState(false)
  const isIconOnly = iconOnly ?? (Boolean(icon) && !children)
  const isRound = round ?? rounded

  async function handleClick() {
    setIsActionLoading(true)
    try {
      await onClick?.()
    } finally {
      setIsActionLoading(false)
    }
  }

  const legacyColorStyle = color
    ? {
        backgroundColor: disabled ? `${color}33` : color,
        borderColor: color ? `${color}00` : undefined,
      }
    : undefined

  const resolvedAppearance = resolveAppearance(variant, appearance, isIconOnly)

  return (
    <Tooltip tooltip={tooltip || ""} style={{ position: "relative" }}>
      <RSButton
        ref={ref}
        className={cx(
          "button",
          variant === "danger" && "button--danger",
          isIconOnly && "button--icon-only",
          isRound && "button--round",
          className,
        )}
        style={{
          ...legacyColorStyle,
          ...style,
        }}
        appearance={resolvedAppearance}
        size={size ?? (isIconOnly ? "xs" : "sm")}
        onClick={handleClick}
        disabled={disabled || loading || isActionLoading}
        {...buttonProps}
      >
        {loading || isActionLoading ? (
          <Loader size="xs" style={{ marginRight: children ? 8 : 0 }} />
        ) : (
          icon
        )}
        {children}
      </RSButton>
    </Tooltip>
  )
})

Button.displayName = "Button"
