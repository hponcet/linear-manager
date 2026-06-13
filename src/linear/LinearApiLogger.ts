import { window } from "vscode"

const callCounts = new Map<string, number>()
let totalCalls = 0

export function logLinearApiCall(source: string): void {
  totalCalls += 1
  callCounts.set(source, (callCounts.get(source) || 0) + 1)

  if (process.env.NODE_ENV === "development") {
    // Temporary API usage tracking — remove when quota comparison is done
    console.warn(`[Linear API] ${source} (total: ${totalCalls})`)
  }
}

export function getLinearApiCallSummary(): { total: number; bySource: Record<string, number> } {
  return {
    total: totalCalls,
    bySource: Object.fromEntries(callCounts.entries()),
  }
}

export function logLinearApiCallSummary(): void {
  const { total, bySource } = getLinearApiCallSummary()
  const lines = Object.entries(bySource)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => `  ${source}: ${count}`)

  window
    .createOutputChannel("Linear Manager API")
    .appendLine(`Linear API calls: ${total}\n${lines.join("\n")}`)
}

export function resetLinearApiCallSummary(): void {
  callCounts.clear()
  totalCalls = 0
}
