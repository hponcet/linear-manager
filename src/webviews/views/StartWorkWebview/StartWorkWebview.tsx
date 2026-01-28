import { Container } from "src/webviews/components/Container/Container";
import { IssueContextProvider } from "src/webviews/contexts/IssueContext";
import { useProps } from "src/webviews/hooks/useProps";
import { StartWorkContent } from "./StartWorkContent";
import { useIssueBranches } from "src/webviews/hooks/useGitBranches";

export function StartWorkWebview() {
  const [props, loaded] = useProps<"startWork">();

  const {
    issueId,
    linearAccessToken,
    fromCheckout,
  } = props;

  const {
    branches,
    currentBranch,
    isLoading,
    issueSettings,
    repoInitialized,
    gitApiInitialized,
    updateIssueSettings,
  } = useIssueBranches({ issueId: issueId! });

  if (!issueId || !linearAccessToken || isLoading) {
    return <Container loading={true} />;
  }

  return (
    <IssueContextProvider
      isLoading={!loaded}
      issueId={issueId}
      linearAccessToken={linearAccessToken}
    >
      <Container loading={!loaded}>
        <StartWorkContent
          branches={branches}
          currentBranch={currentBranch}
          fromCheckout={fromCheckout}
          repoInitialized={repoInitialized}
          gitInitialized={gitApiInitialized }
          issueSettings={issueSettings}
          updateIssueSettings={updateIssueSettings}
        />
      </Container>
    </IssueContextProvider>
  );
}
