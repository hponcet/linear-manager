import { forwardRef, ReactNode, useState } from "react"
import { Loader, Button as RSButton, type ButtonProps as RSButtonProps } from "rsuite"

import { Tooltip } from "../Tooltip/Tooltip"

import "./Button.scss"

export type ButtonProps = Omit<RSButtonProps, "color"> & {
  children?: ReactNode
  tooltip?: ReactNode
  onClick?: () => void | Promise<void>
  disabled?: boolean
  color?: string
  rounded?: boolean
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    children,
    tooltip,
    onClick,
    disabled,
    className,
    color,
    style,
    rounded,
    loading,
    icon,
    ...buttonProps
  } = props

  const [isActionLoading, setIsActionLoading] = useState(false)

  async function handleClick() {
    setIsActionLoading(true)
    try {
      await onClick?.()
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <Tooltip tooltip={tooltip || ""} style={{ position: "relative" }}>
      <RSButton
        ref={ref}
        className={`button ${className || ""}`}
        style={{
          backgroundColor: disabled ? `${color}33` : color,
          borderColor: color ? `${color}00` : undefined,
          ...style,
        }}
        onClick={handleClick}
        disabled={disabled || loading || isActionLoading}
        btn-rounded={String(!!rounded)}
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
