type GitPullRequestIconProps = {
  size?: number
  style?: React.CSSProperties
}

export function GitPullRequestIcon(props: GitPullRequestIconProps) {
  const { size = 14, style } = props

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      style={style}
      aria-hidden="true"
    >
      <path d="M7.177 2.672A2.25 2.25 0 0 1 9.75 4.5v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75v.75a.75.75 0 0 1-1.5 0v-.75A2.25 2.25 0 0 1 6.177 2.672h1ZM4.5 7.5a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75ZM4 10.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm7.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM8 4.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
    </svg>
  )
}
