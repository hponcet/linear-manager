import {
  GIT_PULL_REQUEST_CREATE_ICON_PATH,
  GIT_PULL_REQUEST_ICON_PATH,
} from "./gitPullRequestIconPath"

type GitPullRequestIconProps = {
  size?: number
  style?: React.CSSProperties
  className?: string
  variant?: "create" | "view"
}

export function GitPullRequestIcon(props: GitPullRequestIconProps) {
  const { size = 14, style, className, variant = "create" } = props
  const path = variant === "view" ? GIT_PULL_REQUEST_ICON_PATH : GIT_PULL_REQUEST_CREATE_ICON_PATH

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
      <path fillRule="evenodd" clipRule="evenodd" d={path} />
    </svg>
  )
}
