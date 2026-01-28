import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { Ref } from "src/types/GitAPI";
import { StartWorkHeader } from "./StartWorkHeader";
import { StartWorkBranchCreation } from "./StartWorkBranchCreation";
import { useMemo } from "react";
import { IssueVscState } from "src/vscStates";
import { checkPossiblyExistingBranchName } from "src/webviews/utils/branches";
import { StartWorkBanner } from "./StartWorkBanner";
import { useIssueBranches } from "src/webviews/hooks/useGitBranches";

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

  const { issue } = useIssueContext();
  const { hasUncommittedChanges } = useIssueBranches({ issueId: issue.id });

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

  return (
    <div>
      <StartWorkHeader />
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
        />
      </StartWorkBanner>
    </div>
  );
}
