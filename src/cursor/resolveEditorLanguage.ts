/** Human-readable language name for agent prompts (from VS Code `env.language`). */
export function resolveEditorLanguage(locale?: string): string {
  const normalized = locale?.trim() || "en"
  const languageCode = normalized.split("-")[0] ?? normalized

  try {
    const displayNames = new Intl.DisplayNames([normalized], { type: "language" })
    return displayNames.of(languageCode) ?? normalized
  } catch {
    return normalized
  }
}
