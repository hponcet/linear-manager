import { Issue } from "@linear/sdk"
import { Controller } from "src/controller"
import { readAgentSettings } from "src/cursor/agentPromptSettings"
import { buildIssueAgentPrompt } from "src/cursor/buildIssueAgentPrompt"
import { ensureCursorEnvironment } from "src/cursor/detectCursorEnvironment"
import { openCursorAgentWithPrompt } from "src/cursor/openCursorAgent"
import { ExtensionContext, env, window } from "vscode"

export async function launchCursorAgentForIssue(
  issue: Pick<Issue, "id" | "identifier">,
  context: ExtensionContext,
): Promise<void> {
  if (!(await ensureCursorEnvironment())) {
    void window.showInformationMessage("Start work with agent is available in Cursor only.")
    return
  }

  let identifier = issue.identifier?.trim()
  if (!identifier) {
    const loadedIssue = await Controller.linearService.getIssue(issue.id)
    identifier = loadedIssue.identifier
  }

  const agentSettings = readAgentSettings(context)
  const prompt = buildIssueAgentPrompt(identifier, agentSettings, {
    editorLanguageLocale: env.language,
  })
  await openCursorAgentWithPrompt(prompt)
}

export async function launchCursorAgentForIssueId(
  issueId: string,
  context: ExtensionContext,
): Promise<void> {
  const issue = await Controller.linearService.getIssue(issueId)
  await launchCursorAgentForIssue(issue, context)
}
