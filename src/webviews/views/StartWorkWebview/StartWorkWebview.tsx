import { Container } from "src/webviews/components/Container/Container";
import { IssueContextProvider } from "src/webviews/contexts/IssueContext";
import { useProps } from "src/webviews/hooks/useProps";
import { StartWorkContent } from "./StartWorkContent";

export function StartWorkWebview() {
  const [props, loaded] = useProps<"startWork">();
  const { branches, currentBranch, issueId, linearAccessToken } = props;

  if (!issueId || !linearAccessToken) {
    return <Container loading={true} />;
  }

  return (
    <IssueContextProvider
      isLoading={!loaded}
      issueId={issueId}
      linearAccessToken={linearAccessToken}
    >
      <Container loading={!loaded}>
        <StartWorkContent branches={branches} currentBranch={currentBranch} />
      </Container>
    </IssueContextProvider>
  );
}
