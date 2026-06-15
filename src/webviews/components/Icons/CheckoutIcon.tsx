import { CHECKOUT_ICON_PATH } from "./checkoutIconPath"

type CheckoutIconProps = {
  style?: React.CSSProperties
  className?: string
  size?: number
}

export function CheckoutIcon(props: CheckoutIconProps) {
  const { style, className, size = 16 } = props

  return (
    <svg
      className={className}
      width={size}
      height={size}
      style={style}
      fill="currentColor"
      role="img"
      focusable="false"
      aria-hidden="true"
      viewBox="0 0 640 640"
    >
      {/* !Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc. */}
      <path d={CHECKOUT_ICON_PATH} />
    </svg>
  )
}
