type ReplyIconProps = {
  style?: React.CSSProperties
  className?: string
  size?: number
}

export function ResolveIcon(props: ReplyIconProps) {
  const { style, className, size = 14 } = props

  return (
    <svg
      className={className}
      width={size}
      height={size}
      style={style}
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      focusable="false"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.6722 3.27047C15.0901 3.6482 15.1112 4.28103 14.7195 4.68394L6.94174 12.6839C6.74966 12.8815 6.48271 12.9955 6.2019 12.9999C5.9211 13.0042 5.65047 12.8986 5.45189 12.7071L1.30374 8.70711C0.898753 8.31659 0.898753 7.68342 1.30374 7.2929C1.70873 6.90237 2.36534 6.90237 2.77033 7.2929L6.16115 10.5626L13.2064 3.31606C13.5981 2.91315 14.2544 2.89274 14.6722 3.27047Z"></path>
    </svg>
  )
}
