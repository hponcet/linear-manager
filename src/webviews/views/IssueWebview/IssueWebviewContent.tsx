import { Container } from "src/webviews/components/Container/Container";
import { IssueHeader } from "src/webviews/views/IssueWebview/IssueHeader";
import { IssueContent } from "./IssueContent";
import { IssueActivity } from "src/webviews/components/IssueActivity/IssueActivity";
import { CommentInput } from "src/webviews/components/Comment/CommentInput";
import { SubIssues } from "src/webviews/components/SubIssues/SubIssues";

import "./IssueWebviewContent.scss";

export function IssueWebviewContent() {
  return (
    <Container>
      <IssueHeader />
      <div className="issueBody">
        <IssueContent />
        <SubIssues />
        <IssueActivity />
        <CommentInput />
      </div>
    </Container>
  );
}
