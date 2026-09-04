import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

function TableGlyph({ className, children, ...props }: SvgProps) {
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

export const AddRowIcon = memo(({ ...props }: SvgProps) => (
  <TableGlyph {...props}>
    <path d="M4 4h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v4h14V6H5Z" />
    <path d="M11 15h2v2h2v2h-2v2h-2v-2H9v-2h2v-2Z" />
  </TableGlyph>
))
AddRowIcon.displayName = "AddRowIcon"

export const DeleteRowIcon = memo(({ ...props }: SvgProps) => (
  <TableGlyph {...props}>
    <path d="M4 4h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v4h14V6H5Z" />
    <path d="M9 17h6v2H9v-2Z" />
  </TableGlyph>
))
DeleteRowIcon.displayName = "DeleteRowIcon"

export const AddColumnIcon = memo(({ ...props }: SvgProps) => (
  <TableGlyph {...props}>
    <path d="M4 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h4V5H5Z" />
    <path d="M15 11h2V9h2v2h2v2h-2v2h-2v-2h-2v-2Z" />
  </TableGlyph>
))
AddColumnIcon.displayName = "AddColumnIcon"

export const DeleteColumnIcon = memo(({ ...props }: SvgProps) => (
  <TableGlyph {...props}>
    <path d="M4 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h4V5H5Z" />
    <path d="M15 11h6v2h-6v-2Z" />
  </TableGlyph>
))
DeleteColumnIcon.displayName = "DeleteColumnIcon"

export const SortAscendingIcon = memo(({ ...props }: SvgProps) => (
  <TableGlyph {...props}>
    <path d="M4 5h6v2H4V5Zm0 6h10v2H4v-2Zm0 6h16v2H4v-2Z" />
  </TableGlyph>
))
SortAscendingIcon.displayName = "SortAscendingIcon"

export const SortDescendingIcon = memo(({ ...props }: SvgProps) => (
  <TableGlyph {...props}>
    <path d="M4 5h16v2H4V5Zm0 6h10v2H4v-2Zm0 6h6v2H4v-2Z" />
  </TableGlyph>
))
SortDescendingIcon.displayName = "SortDescendingIcon"
