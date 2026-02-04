import { EstimateDataItem } from "src/webviews/utils/issueEstimateByType"

type EstimateIconProps = {
  estimate?: EstimateDataItem | null
  size?: number
  style?: React.CSSProperties
  className?: string
}

export function EstimateIcon(props: EstimateIconProps) {
  const { style, className, estimate, size = 16 } = props

  if (!estimate?.value) {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="currentColor"
        role="img"
        focusable="false"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        style={style}
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M8.666 3.77a.75.75 0 0 0-1.329 0L6.033 6.26l-1.329-.696 1.305-2.49c.842-1.609 3.144-1.609 3.986 0l1.305 2.49-1.33.696-1.304-2.49ZM9.545 13v1.5h2.717c1.691 0 2.778-1.795 1.993-3.293l-1.304-2.49-1.329.695 1.305 2.49a.75.75 0 0 1-.665 1.099H9.545ZM4.382 9.413l-1.33-.696-1.304 2.49c-.785 1.499.302 3.295 1.993 3.295H6.46V13H3.74a.75.75 0 0 1-.664-1.098l1.305-2.49Z"
          clipRule="evenodd"
        ></path>
      </svg>
    )
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      focusable="false"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <path
        fillRule="evenodd"
        d="M3.741 14.5h8.521c1.691 0 2.778-1.795 1.993-3.293l-4.26-8.134c-.842-1.608-3.144-1.608-3.986 0l-4.26 8.134C.962 12.705 2.05 14.5 3.74 14.5ZM8 3.368a.742.742 0 0 0-.663.402l-4.26 8.134A.75.75 0 0 0 3.741 13H8V3.367Z"
        clipRule="evenodd"
      ></path>
    </svg>
  )
}
