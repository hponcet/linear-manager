type EmojiIconProps = {
  style?: React.CSSProperties
  className?: string
  size?: number
}

export function EmojiIcon(props: EmojiIconProps) {
  const { style, className, size = 16 } = props

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
      <path d="M8 1a7 7 0 0 1 7 7 .75.75 0 0 1-1.5 0A5.5 5.5 0 1 0 8 13.5.75.75 0 0 1 8 15 7 7 0 1 1 8 1Zm4.25 8.5a.75.75 0 0 1 .743.648l.007.102v1.249l1.25.001a.75.75 0 0 1 .743.648l.007.102a.75.75 0 0 1-.648.743L14.25 13 13 12.999v1.251a.75.75 0 0 1-1.493.102l-.007-.102v-1.251L10.25 13a.75.75 0 0 1-.743-.648L9.5 12.25a.75.75 0 0 1 .648-.743l.102-.007 1.25-.001V10.25a.75.75 0 0 1 .75-.75ZM10.475 8a.5.5 0 0 1 .497.553C10.798 10.184 9.812 11 8.016 11c-1.795 0-2.789-.814-2.982-2.441a.5.5 0 0 1 .438-.556l.03-.002L10.475 8ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"></path>
    </svg>
  )
}
