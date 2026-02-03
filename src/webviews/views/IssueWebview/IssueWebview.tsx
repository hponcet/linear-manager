import { useProps } from "src/webviews/hooks/useProps";
import { IssueContextProvider } from "src/webviews/contexts/IssueContext";
import { Container } from "src/webviews/components/Container/Container";
import { IssueHeader } from "src/webviews/views/IssueWebview/IssueHeader";
import { IssueContent } from "./IssueContent";
import { IssueActivity } from "src/webviews/components/IssueActivity/IssueActivity";
import { CommentInput } from "src/webviews/components/Comment/CommentInput";
import { SubIssues } from "src/webviews/components/SubIssues/SubIssues";
import { Attachments } from "src/webviews/components/Attachments/Attachments";

import "./IssueWebview.scss";
import { ModalsContextProvider } from "src/webviews/contexts/ModalsContext";
import { Separator } from "src/webviews/components/Separator/Separator";

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
      <ModalsContextProvider>
        <Container>
          <IssueHeader />
          <div className="issueBody">
            <IssueContent />
            <SubIssues />
            <Attachments />
            <Separator />
            <IssueActivity />
            <CommentInput />
          </div>
        </Container>
      </ModalsContextProvider>
    </IssueContextProvider>
  );
}
