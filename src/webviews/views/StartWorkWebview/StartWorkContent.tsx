import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Ref } from "src/types/GitAPI";
import { StartWorkHeader } from "./StartWorkHeader";
import { StartWorkBranchCreation } from "./StartWorkBranchCreation";
import { useMemo, useState } from "react";
import { IssueVscState } from "src/vscStates";
import {
  checkPossiblyExistingBranchName,
  getDefaultBranchName,
} from "src/webviews/utils/branches";
import { StartWorkBanner } from "./StartWorkBanner";
import { useIssueBranches } from "src/webviews/hooks/useGitBranches";
import { BranchNamingSettings } from "./BranchNamingSettings";
import { useSettings } from "src/webviews/hooks/useSettings";

export type StartWorkContentProps = {
  branches?: Ref[];
  currentBranch?: Ref | null;
  fromCheckout: boolean;
  repoInitialized: boolean;
  gitInitialized: boolean;
  issueSettings: IssueVscState[string];
  updateIssueSettings: (value: Partial<IssueVscState[string]>) => void;
};

export function StartWorkContent(props: StartWorkContentProps) {
  const {
    branches,
    currentBranch,
    fromCheckout,
    repoInitialized,
    gitInitialized,
    issueSettings,
    updateIssueSettings,
  } = props;

  const { issue, issueLabels, issueLabelsLoading } = useIssueContext();
  const { hasUncommittedChanges } = useIssueBranches({ issueId: issue.id });
  const { branchesSettings, branchesSettingsAreLoading } = useSettings();

  const [branchNamingSettingsOpen, setBranchNamingSettingsOpen] =
    useState(false);

  const { matchingBranches, existingBranch } = useMemo(() => {
    const [matchingBranches, existingBranch] = checkPossiblyExistingBranchName(
      issueSettings.branch?.name || issue.branchName || "",
      issue.identifier,
      branches?.filter(
        (b) => !issueSettings.ignoredBranches?.includes(b.name || ""),
      ) || [],
    );

    return { matchingBranches, existingBranch };
  }, [branches, issueSettings.branch]);

  const initialBranchName = useMemo(() => {
    return (
      issueSettings.branch?.name ||
      getDefaultBranchName(issue, branchesSettings, issueLabels)
    );
  }, [
    issueSettings.branch,
    issue.branchName,
    branchesSettingsAreLoading,
    issueLabelsLoading,
  ]);

  console.log(initialBranchName);

  if (branchesSettingsAreLoading || issueLabelsLoading) {
    return null;
  }

  return (
    <div>
      <StartWorkHeader
        setBranchNamingSettingsOpen={setBranchNamingSettingsOpen}
      />
      <h5>
        {fromCheckout ? "Create branch for issue" : "Start work on issue"}{" "}
        {issue.identifier}
      </h5>

      <StartWorkBanner
        issue={issue}
        repoInitialized={repoInitialized}
        gitInitialized={gitInitialized}
        fromCheckout={fromCheckout}
        hasUncommittedChanges={hasUncommittedChanges}
        matchingBranches={matchingBranches}
        existingBranch={existingBranch}
        issueSettings={issueSettings}
        updateIssueSettings={updateIssueSettings}
      >
        <StartWorkBranchCreation
          issue={issue}
          branches={branches}
          currentBranch={currentBranch}
          issueSettings={issueSettings}
          updateIssueSettings={updateIssueSettings}
          initialBranchName={initialBranchName}
        />
      </StartWorkBanner>
      <BranchNamingSettings
        issue={issue}
        open={branchNamingSettingsOpen}
        onClose={() => setBranchNamingSettingsOpen(false)}
      />
    </div>
  );
}
