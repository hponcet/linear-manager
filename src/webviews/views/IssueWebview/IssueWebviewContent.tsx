import { Container } from "src/webviews/components/Container/Container";
import { IssueHeader } from "src/webviews/views/IssueWebview/IssueHeader";
import { IssueContent } from "./IssueContent";
import { IssueActivity } from "src/webviews/components/IssueActivity/IssueActivity";
import { CommentInput } from "src/webviews/components/Comment/CommentInput/CommentInput";

import "./IssueWebviewContent.scss";

export function IssueWebviewContent() {
  return (
    <Container>
      <IssueHeader />
      <div className="issueBody">
        <IssueContent />
        <IssueActivity />
        <CommentInput />
      </div>
    </Container>
  );
}
