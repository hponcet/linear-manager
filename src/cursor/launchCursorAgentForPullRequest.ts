import { readAgentSettings } from "src/cursor/agentPromptSettings"
import { PullRequestInfo } from "src/gitProviders/types"
import { ExtensionContext, env, window } from "vscode"

import { buildPullRequestReviewPrompt } from "./buildPullRequestReviewPrompt"
import { ensureCursorEnvironment } from "./detectCursorEnvironment"
import { openCursorAgentWithPrompt } from "./openCursorAgent"

export async function launchCursorAgentForPullRequest(
  pullRequest: PullRequestInfo,
  context: ExtensionContext,
): Promise<void> {
  if (!(await ensureCursorEnvironment())) {
    void window.showInformationMessage("Review with agent is available in Cursor only.")
    return
  }

  const agentSettings = readAgentSettings(context)
  const prompt = buildPullRequestReviewPrompt(pullRequest, agentSettings, {
    editorLanguageLocale: env.language,
  })
  await openCursorAgentWithPrompt(prompt)
}
