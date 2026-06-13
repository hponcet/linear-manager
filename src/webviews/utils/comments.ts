import { SerializedComment, SerializedReaction } from "src/types/SerializedLinear"
import { addKeyOnItem } from "src/utils/addKeyOnItem"

export type Comment = ReturnType<typeof addKeyOnItem<SerializedComment, "comment">> & {
  childrenComments?: Comment[]
  resolver: boolean | undefined
  reactions?: SerializedReaction[]
  resolvedAt?: Date
}

export function isCommentThreadResolved(
  comment: Pick<Comment, "resolvingCommentId" | "resolvingUserId" | "resolvedAt">,
): boolean {
  return !!(comment.resolvingCommentId || comment.resolvingUserId || comment.resolvedAt)
}

export function applyThreadResolvedState(
  comments: Comment[],
  threadRootId: string,
  resolved: boolean,
  options?: { resolvingCommentId?: string | null; resolvingUserId?: string | null },
): Comment[] {
  function patchRoot(comment: Comment): Comment {
    if (comment.id !== threadRootId) {
      return {
        ...comment,
        childrenComments: comment.childrenComments?.map(patchRoot),
      }
    }

    if (!resolved) {
      return {
        ...comment,
        resolvingCommentId: null,
        resolvingUserId: null,
        resolvedAt: undefined,
        resolver: undefined,
        childrenComments: comment.childrenComments?.map((child) => ({
          ...child,
          resolver: undefined,
        })),
      }
    }

    const resolvingCommentId = options?.resolvingCommentId ?? null
    const resolvingUserId = options?.resolvingUserId ?? null

    return {
      ...comment,
      resolvingCommentId,
      resolvingUserId,
      resolvedAt: new Date(),
      resolver: resolvingCommentId === comment.id ? true : comment.resolver,
      childrenComments: comment.childrenComments?.map((child) => ({
        ...child,
        resolver: child.id === resolvingCommentId ? true : child.resolver,
      })),
    }
  }

  return comments.map(patchRoot)
}

export function orderComments(comments: SerializedComment[]): Comment[] {
  const resolvedComments = {} as Record<string, true>

  for (const comment of comments) {
    if (comment.resolvingCommentId) {
      resolvedComments[comment.resolvingCommentId] = true
    }
  }

  const mappedComments = comments.reduce(
    (acc, comment) => {
      acc[comment.id] = {
        ...addKeyOnItem(comment, "comment"),
        id: comment.id,
        userId: comment.userId,
        parentId: comment.parentId || null,
        resolvingCommentId: comment.resolvingCommentId ?? null,
        resolvingUserId: comment.resolvingUserId ?? null,
        resolvedAt: comment.resolvedAt,
        resolver: resolvedComments[comment.id],
        body: comment.body,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        reactions: comment.reactions ?? [],
        childrenComments: [],
      } as unknown as Comment
      return acc
    },
    {} as Record<string, Comment>,
  )

  const rootComments: Comment[] = []
  Object.values(mappedComments).forEach((c) => {
    if (c.parentId && mappedComments[c.parentId]) {
      if (!mappedComments[c.parentId].childrenComments) {
        mappedComments[c.parentId].childrenComments = []
      }
      mappedComments[c.parentId].childrenComments!.push(c)
    } else {
      rootComments.push(c)
    }
  })

  function sortComments(comments: Comment[]): Comment[] {
    return comments
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((c) => {
        if (c.childrenComments) {
          c.childrenComments = sortComments(c.childrenComments)
        }
        return c
      })
  }

  return sortComments(rootComments)
}
