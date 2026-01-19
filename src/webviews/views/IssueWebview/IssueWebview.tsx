import { useProps } from "src/webviews/hooks/useProps";
import { IssueContextProvider } from "src/webviews/contexts/IssueContext";
import { Container } from "src/webviews/components/Container/Container";
import { IssueHeader } from "src/webviews/views/IssueWebview/IssueHeader";
import { IssueContent } from "./IssueContent";
import { IssueActivity } from "src/webviews/components/IssueActivity/IssueActivity";
import { CommentInput } from "src/webviews/components/Comment/CommentInput";
import { SubIssues } from "src/webviews/components/SubIssues/SubIssues";

import "./IssueWebview.scss";

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
      <Container>
        <IssueHeader />
        <div className="issueBody">
          <IssueContent />
          <SubIssues />
          <IssueActivity />
          <CommentInput />
        </div>
      </Container>
    </IssueContextProvider>
  );
}
