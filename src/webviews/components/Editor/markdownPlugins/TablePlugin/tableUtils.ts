export type SortDirection = "ascending" | "descending"

export function sortRowsByColumn<T>(
  rows: readonly T[],
  getValue: (row: T) => string,
  direction: SortDirection,
): T[] {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
  const multiplier = direction === "ascending" ? 1 : -1

  return rows
    .map((row, index) => ({ row, index }))
    .sort(
      (left, right) =>
        collator.compare(getValue(left.row), getValue(right.row)) * multiplier ||
        left.index - right.index,
    )
    .map(({ row }) => row)
}
