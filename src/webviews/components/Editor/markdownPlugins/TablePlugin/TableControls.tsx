import { Fragment } from "@tiptap/pm/model"
import {
  findTable,
  moveTableColumn,
  moveTableRow,
  rowIsHeader,
  selectedRect,
} from "@tiptap/pm/tables"
import { Editor } from "@tiptap/react"
import { ArrowLeftIcon } from "src/webviews/components/Editor/components/tiptap-icons/arrow-left-icon"
import {
  AddColumnIcon,
  AddRowIcon,
  DeleteColumnIcon,
  DeleteRowIcon,
  SortAscendingIcon,
  SortDescendingIcon,
} from "src/webviews/components/Editor/components/tiptap-icons/table-icons"
import { TrashIcon } from "src/webviews/components/Editor/components/tiptap-icons/trash-icon"
import { Button } from "src/webviews/components/Editor/components/tiptap-ui-primitive/button"
import { ToolbarGroup } from "src/webviews/components/Editor/components/tiptap-ui-primitive/toolbar"

import { SortDirection, sortRowsByColumn } from "./tableUtils"

function sortSelectedColumn(editor: Editor, direction: SortDirection) {
  if (!editor.isActive("table")) return false

  const { state, view } = editor
  const table = findTable(state.selection.$from)
  if (!table) return false

  const rect = selectedRect(state)
  const rows = Array.from(table.node.content.content)
  const header = rowIsHeader(rect.map, rect.table, 0) ? rows.shift() : undefined
  const sortedRows = sortRowsByColumn(
    rows,
    (row) => row.child(rect.left).textContent.trim(),
    direction,
  )
  const content = header ? [header, ...sortedRows] : sortedRows
  const sortedTable = table.node.copy(Fragment.fromArray(content))
  view.dispatch(
    state.tr.replaceWith(table.pos, table.pos + table.node.nodeSize, sortedTable).scrollIntoView(),
  )
  return true
}

function TableButton(props: {
  label: string
  icon: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  const { label, icon, disabled, onClick } = props
  return (
    <Button
      type="button"
      data-style="ghost"
      data-disabled={disabled}
      tabIndex={-1}
      aria-label={label}
      tooltip={label}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </Button>
  )
}

export function TableControls(props: { editor: Editor }) {
  const { editor } = props
  if (!editor.isActive("table")) return null

  const rect = selectedRect(editor.state)
  const firstMovableRow = rowIsHeader(rect.map, rect.table, 0) ? 1 : 0
  const rowCount = rect.map.height
  const columnCount = rect.map.width
  const dispatch = editor.view.dispatch.bind(editor.view)

  return (
    <ToolbarGroup
      className="linear-table-controls"
      aria-label="Table controls"
      data-linear-editor-ui=""
    >
      <TableButton
        label="Add row"
        icon={<AddRowIcon className="tiptap-button-icon" />}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      />
      <TableButton
        label="Delete row"
        icon={<DeleteRowIcon className="tiptap-button-icon" />}
        onClick={() => editor.chain().focus().deleteRow().run()}
      />
      <TableButton
        label="Move row up"
        icon={
          <ArrowLeftIcon className="tiptap-button-icon" style={{ transform: "rotate(90deg)" }} />
        }
        disabled={rect.top <= firstMovableRow}
        onClick={() => moveTableRow({ from: rect.top, to: rect.top - 1 })(editor.state, dispatch)}
      />
      <TableButton
        label="Move row down"
        icon={
          <ArrowLeftIcon className="tiptap-button-icon" style={{ transform: "rotate(-90deg)" }} />
        }
        disabled={rect.top >= rowCount - 1 || rect.top < firstMovableRow}
        onClick={() => moveTableRow({ from: rect.top, to: rect.top + 1 })(editor.state, dispatch)}
      />
      <TableButton
        label="Sort ascending"
        icon={<SortAscendingIcon className="tiptap-button-icon" />}
        onClick={() => sortSelectedColumn(editor, "ascending")}
      />
      <TableButton
        label="Sort descending"
        icon={<SortDescendingIcon className="tiptap-button-icon" />}
        onClick={() => sortSelectedColumn(editor, "descending")}
      />
      <TableButton
        label="Add column"
        icon={<AddColumnIcon className="tiptap-button-icon" />}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      />
      <TableButton
        label="Delete column"
        icon={<DeleteColumnIcon className="tiptap-button-icon" />}
        onClick={() => editor.chain().focus().deleteColumn().run()}
      />
      <TableButton
        label="Move column left"
        icon={<ArrowLeftIcon className="tiptap-button-icon" />}
        disabled={rect.left === 0}
        onClick={() =>
          moveTableColumn({ from: rect.left, to: rect.left - 1 })(editor.state, dispatch)
        }
      />
      <TableButton
        label="Move column right"
        icon={
          <ArrowLeftIcon className="tiptap-button-icon" style={{ transform: "rotate(180deg)" }} />
        }
        disabled={rect.left >= columnCount - 1}
        onClick={() =>
          moveTableColumn({ from: rect.left, to: rect.left + 1 })(editor.state, dispatch)
        }
      />
      <TableButton
        label="Delete table"
        icon={<TrashIcon className="tiptap-button-icon" />}
        onClick={() => editor.chain().focus().deleteTable().run()}
      />
    </ToolbarGroup>
  )
}
