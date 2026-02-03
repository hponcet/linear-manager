import { Issue } from "@linear/sdk";
import { useVSCState } from "./useVSCState";
import { IssueVscState, VscStateKeys } from "src/vscStates";
import { useMemo } from "react";

type UseIssueSettingsParams = {
  issueId: Issue["id"];
};

const defaultIssueSettings: IssueVscState[string] = {
  branch: undefined,
  branchInitialized: false,
  ignoredBranches: [],
};

export function useIssueSettings(params: UseIssueSettingsParams) {
  const { issueId } = params;

  const [issuesSettings, setIssueSettings, issueSettingsAreLoading] =
    useVSCState<IssueVscState>(VscStateKeys.issueSettings, {
      [issueId]: defaultIssueSettings,
    });

  const issueSettings = useMemo(
    () => issuesSettings[issueId] || defaultIssueSettings,
    [issuesSettings, issueId],
  );

  function updateIssueSettings(value: Partial<IssueVscState[string]>) {
    if (!issueId) return;
    setIssueSettings((s) => ({
      ...s,
      [issueId]: { ...s[issueId], ...value },
    }));
  }
  return { issueSettings, updateIssueSettings, issueSettingsAreLoading };
}
