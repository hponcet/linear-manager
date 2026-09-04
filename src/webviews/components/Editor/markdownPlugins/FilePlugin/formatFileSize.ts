const units = ["B", "KB", "MB", "GB", "TB"] as const

/**
 * Renders a byte count the way Linear labels an attachment (binary units, one decimal above
 * bytes), so a file card reads "21.5 KB" instead of "22014 bytes".
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ""

  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }

  return `${unit === 0 ? Math.round(value) : Number(value.toFixed(1))} ${units[unit]}`
}
