import { useEffect, useMemo, useState } from "react";
import { useIssueContext } from "src/webviews/contexts/IssueContext";
import { WorkflowStatePicker } from "src/webviews/components/WorklfowStatePicker/WorkflowStatePicker";
import { BranchPicker } from "src/webviews/components/BranchPicker/BranchPicker";
import { Ref } from "src/types/GitAPI";
import { BranchNameInput } from "src/webviews/components/BranchNameInput/BranchNameInput+";
import { getFirstStateOfType } from "src/panels/commons/worflowStates";
import { Issue } from "@linear/sdk";
import { FormQueueAsync } from "src/webviews/components/FormQueueAsync/FormQueueAsync";
import { FormQueueField } from "src/webviews/components/FormQueueAsync/FormQueueField";
import { StartWorkHeader } from "./StartWorkHeader";
import { ProjectCyclePicker } from "src/webviews/components/ProjectCyclePicker/ProjectCyclePicker";
import { Banner } from "src/webviews/components/Banner/Banner";
import { Branch } from "src/webviews/components/BranchPicker/Branch";
import { useAsyncEffect } from "src/webviews/hooks/useAsyncEffect";

export type StartWorkContentProps = {
  branches?: Ref[];
  currentBranch?: Ref | null;
};

export function StartWorkContent(props: StartWorkContentProps) {
  const { branches, currentBranch } = props;

  const { issue, update, workflowStates, cycles } = useIssueContext();

  const [hasUncommittedChanges, setHasUncommittedChanges] = useState(false);
  const [issueFieldsUpates, setIssueFieldsUpdates] = useState<Partial<Issue>>({
    stateId: undefined,
    branchName: issue?.branchName || "",
  });

  function checkPossiblyExistingBranchName(
    branchName: string
  ): [Ref[], Ref | null, Ref | undefined] {
    const name = branchName.split("/").pop();
    const [projectKey, issueNumber] = issue.identifier.toLowerCase().split("-");

    const checkIssueKey = new RegExp(
      `(${projectKey}|${projectKey.toUpperCase()})(-|_|)${issueNumber}`
    );

    const checkIssueNumber = new RegExp(
      `(${projectKey}|${projectKey.toUpperCase()})(-|_|)([0-9].+)$`
    );

    let mostUpperIssue: number | null = null;
    let mostUpperIssueBranch: Ref | null = null;

    const matchingBranches =
      branches
        ?.filter((b) => {
          if (b.name?.toLowerCase() === branchName?.toLowerCase()) return true;

          if (name?.toLowerCase() && b.name?.endsWith(name?.toLowerCase()))
            return true;

          if (b.name?.match(checkIssueKey)) return true;

          const matches = b.name?.match(checkIssueNumber) || [];
          const branchIssueNumber = matches[3];

          if (branchIssueNumber === issueNumber) return true;
          if (
            branchIssueNumber &&
            (!mostUpperIssue || parseInt(branchIssueNumber) > mostUpperIssue)
          ) {
            mostUpperIssue = parseInt(branchIssueNumber);
            mostUpperIssueBranch = b;
          }
          return false;
        })
        .sort((a, b) => a.name!.localeCompare(b.name!)) || [];

    const branchExist = matchingBranches.find(
      (b) => b.name?.toLowerCase() === branchName?.toLowerCase()
    );

    return [matchingBranches, mostUpperIssueBranch, branchExist];
  }

  function validateBranchName(): Promise<void> {
    if (!issueFieldsUpates.branchName) {
      throw new Error("Branch name is required");
    }

    if (issueFieldsUpates.branchName.includes(" ")) {
      throw new Error("Branch name cannot contain spaces");
    }
    if (branches?.some((b) => b.name === issueFieldsUpates.branchName)) {
      throw new Error("Branch name already exists");
    }
    return Promise.resolve();
  }

  const [matchingBranches, mostUpperIssueBranch, branchExist] = useMemo(
    () => checkPossiblyExistingBranchName(issueFieldsUpates.branchName || ""),
    [issueFieldsUpates, branches]
  );

  useEffect(() => {
    if (!workflowStates || !cycles) {
      return;
    }

    setIssueFieldsUpdates((i) => ({
      ...i,
      stateId: getFirstStateOfType(workflowStates, "started")?.id || undefined,
      cycleId: cycles.find((c) => c.isActive)?.id || undefined,
    }));
  }, [workflowStates, cycles, mostUpperIssueBranch]);

  useAsyncEffect(async () => {
    while (true) {
      const hasUncommittedChanges =
        await update.panelActions.hasUncommittedChanges();
      setHasUncommittedChanges(hasUncommittedChanges);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }, []);

  if (!workflowStates || !cycles) {
    return null;
  }

  return (
    <div>
      <StartWorkHeader />

      <h5>Start work on issue {issue.identifier}</h5>

      {hasUncommittedChanges && (
        <Banner type="error" style={{ marginBottom: 30 }}>
          You have uncommitted changes in your working directory. Please commit
          or stash them before starting work on a new issue.
        </Banner>
      )}

      {!hasUncommittedChanges && matchingBranches.length > 0 && (
        <Banner type="warning" style={{ marginBottom: 30 }}>
          <p>
            We have detected several branches that are likely to originate from
            this issue:
          </p>
          <ul>
            {matchingBranches.map((branch) => (
              <Branch key={branch.name} branch={branch} />
            ))}
          </ul>
        </Banner>
      )}

      {!hasUncommittedChanges && (
        <FormQueueAsync
          canRetry
          canRestart
          startButtonLabel="Start work"
          endButtonLabel="Close"
          actionOnComplete={() => update.panelActions.closePanel()}
        >
          <FormQueueField
            label="Use a custom branch name"
            errors={branchExist ? ["Branch name already exists"] : undefined}
            disabled={!branchExist || false}
            input={(expand) => (
              <BranchNameInput
                name={issueFieldsUpates.branchName}
                style={{ marginLeft: 10, width: "-webkit-fill-available" }}
                onChange={(name) =>
                  setIssueFieldsUpdates((i) => ({ ...i, branchName: name }))
                }
                inline={!expand ? "text" : undefined}
              />
            )}
            onProcess={validateBranchName}
          />
          <FormQueueField
            label="Create branch from"
            input={
              <BranchPicker
                branches={branches || []}
                branch={mostUpperIssueBranch || currentBranch || null}
              />
            }
            onProcess={() =>
              update.panelActions.createBranch(
                issueFieldsUpates.branchName!,
                (mostUpperIssueBranch || currentBranch!)!
              )
            }
          />
          <FormQueueField
            label="Update issue state to"
            disabled={issueFieldsUpates.stateId === issue.stateId || undefined}
            input={
              <WorkflowStatePicker
                issue={issueFieldsUpates as Issue}
                onChange={(stateId) =>
                  setIssueFieldsUpdates((i) => ({ ...i, stateId }))
                }
                size={16}
              />
            }
            onProcess={() =>
              update.issue(issue.id, { stateId: issueFieldsUpates.stateId })
            }
          />

          <FormQueueField
            label="Update cycle to"
            disabled={issueFieldsUpates.cycleId === issue.cycleId || undefined}
            input={
              <ProjectCyclePicker
                issue={issueFieldsUpates as Issue}
                onChange={(cycleId) =>
                  setIssueFieldsUpdates((i) => ({
                    ...i,
                    cycleId: cycleId || undefined,
                  }))
                }
                size={16}
              />
            }
            onProcess={() =>
              update.issue(issue.id, { cycleId: issueFieldsUpates.cycleId })
            }
          />
        </FormQueueAsync>
      )}
    </div>
  );
}
