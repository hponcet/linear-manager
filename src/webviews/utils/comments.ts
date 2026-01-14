import { Comment as LinearComment } from "@linear/sdk";
import { addKeyOnItem } from "src/utils/addKeyOnItem";

export type Comment = ReturnType<
  typeof addKeyOnItem<LinearComment, "comment">
> & {
  childrenComments?: Comment[];
  resolver: boolean | undefined;
};

export function orderComments(comments: LinearComment[]): Comment[] {
  const resolvedComments = {} as Record<string, true>;

  const mappedComments = comments.reduce((acc, comment) => {
    if (comment.resolvingCommentId) {
      resolvedComments[comment.resolvingCommentId] = true;
    }

    acc[comment.id] = {
      ...addKeyOnItem(comment, "comment"),
      id: comment.id,
      userId: comment.userId,
      parentId: comment.parentId || null,
      resolvingCommentId: comment.resolvingCommentId || null,
      resolvingUserId:
        // @ts-ignore
        comment.resolvingUserId || comments._resolvingUser?.id || null,
      resolver: resolvedComments[comment.id],
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      childrenComments: [],
    } as unknown as Comment;
    return acc;
  }, {} as Record<string, Comment>);

  const rootComments: Comment[] = [];
  Object.values(mappedComments).forEach((c) => {
    if (c.parentId && mappedComments[c.parentId]) {
      if (!mappedComments[c.parentId].childrenComments) {
        mappedComments[c.parentId].childrenComments = [];
      }
      mappedComments[c.parentId].childrenComments!.push(c);
    } else {
      rootComments.push(c);
    }
  });

  function sortComments(comments: Comment[]): Comment[] {
    return comments
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((c) => {
        if (c.childrenComments) {
          c.childrenComments = sortComments(c.childrenComments);
        }
        return c;
      });
  }

  return sortComments(rootComments);
}
