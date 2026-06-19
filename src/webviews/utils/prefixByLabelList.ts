import { SerializedIssueLabel } from "src/types/SerializedLinear"
import { IssueLabelSetting, SettingsVscState } from "src/vscStates"

export type LabelPrefixRow = {
  label: IssueLabelSetting | null
  prefix: string
}

export function mergeLabelsById(
  ...labelLists: Array<
    Array<Pick<SerializedIssueLabel, "id" | "name" | "color"> | IssueLabelSetting>
  >
): SerializedIssueLabel[] {
  const byId = new Map<string, SerializedIssueLabel>()

  for (const list of labelLists) {
    for (const label of list) {
      byId.set(label.id, {
        id: label.id,
        name: label.name,
        color: label.color,
      })
    }
  }

  return Array.from(byId.values())
}

export function filterCompleteLabelPrefixes<T extends LabelPrefixRow>(
  items: T[],
): (T & { label: IssueLabelSetting; prefix: string })[] {
  return items.filter(
    (item): item is T & { label: IssueLabelSetting; prefix: string } =>
      item.label !== null && item.prefix !== "",
  )
}

export function isDraftLabelPrefixRow(row: LabelPrefixRow): boolean {
  return row.label === null || row.prefix === ""
}

export function mergePersistedRowsWithDrafts(
  persisted: SettingsVscState["prefixByLabelList"] | undefined,
  local: LabelPrefixRow[],
): LabelPrefixRow[] {
  const persistedRows =
    persisted?.map((entry) => ({
      label: entry.label,
      prefix: entry.prefix,
    })) ?? []

  const drafts = local.filter(isDraftLabelPrefixRow)

  return [...persistedRows, ...drafts]
}
