import { useAsyncMemo } from "./useAsyncMemo"
import { useLinearApi } from "./useRequestDataUpdate"

export function useWorkspaceLabels() {
  const { getWorkspaceLabels } = useLinearApi()
  const [workspaceLabels, workspaceLabelsLoading] = useAsyncMemo(
    () => getWorkspaceLabels(),
    [getWorkspaceLabels],
  )

  return {
    workspaceLabels: workspaceLabels ?? [],
    workspaceLabelsLoading,
  }
}
