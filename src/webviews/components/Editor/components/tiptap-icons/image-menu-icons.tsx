import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

function MenuGlyph({ className, children, ...props }: SvgProps) {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  )
}

export const ViewImageIcon = memo(({ ...props }: SvgProps) => (
  <MenuGlyph {...props}>
    <path d="M14 3h7v7h-2V6.414l-5.293 5.293-1.414-1.414L17.586 5H14V3ZM3 14h2v3.586l5.293-5.293 1.414 1.414L6.414 19H10v2H3v-7Z" />
  </MenuGlyph>
))
ViewImageIcon.displayName = "ViewImageIcon"

export const DownloadIcon = memo(({ ...props }: SvgProps) => (
  <MenuGlyph {...props}>
    <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293 1.414 1.414L12 16.414l-4.707-4.707 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1Zm-7 15h14v2H5v-2Z" />
  </MenuGlyph>
))
DownloadIcon.displayName = "DownloadIcon"

export const CopyImageIcon = memo(({ ...props }: SvgProps) => (
  <MenuGlyph {...props}>
    <path d="M9 2h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2V3a1 1 0 0 1 1-1Zm1 2v1h4V4h-4ZM7 6v14h10V6h-2v1H9V6H7Z" />
  </MenuGlyph>
))
CopyImageIcon.displayName = "CopyImageIcon"

export const MoreIcon = memo(({ ...props }: SvgProps) => (
  <MenuGlyph {...props}>
    <path d="M6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
  </MenuGlyph>
))
MoreIcon.displayName = "MoreIcon"
