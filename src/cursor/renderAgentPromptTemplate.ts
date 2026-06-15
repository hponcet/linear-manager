export function renderAgentPromptTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  let rendered = template

  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value)
  }

  return rendered
    .replace(/^[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
