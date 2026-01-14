import { useProps } from "src/webviews/hooks/useProps";
import { IssueContextProvider } from "src/webviews/contexts/IssueContext";
import { IssueWebviewContent } from "./IssueWebviewContent";
import { Container } from "src/webviews/components/Container/Container";

export default function IssueWebview() {
  const [props, loaded] = useProps();
  const { issueId, linearAccessToken } = props;

  if (!issueId || !linearAccessToken) {
    return <Container loading={true} />;
  }

  return (
    <IssueContextProvider
      isLoading={!loaded}
      issueId={issueId}
      linearAccessToken={linearAccessToken}
    >
      <IssueWebviewContent />
    </IssueContextProvider>
  );
}
