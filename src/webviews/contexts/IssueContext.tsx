import {
  Cycle,
  Issue,
  IssueLabel,
  IssuePriorityValue,
  LinearClient,
  PaginationOrderBy,
  Project,
  User,
} from "@linear/sdk";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useLinearClient } from "../hooks/useLinearClient";
import { useAsyncEffect } from "../hooks/useAsyncEffect";
import { Container } from "../components/Container/Container";
import { useAsyncMemo } from "../hooks/useAsyncMemo";
import { filterWorkflowStatesByType } from "src/panels/commons/worflowStates";
import { WorkflowStateWithStateProgress } from "src/types/Linear";
import {
  createEstimateDataItems,
  EstimateDataItem,
  issueEstimationByType,
} from "../utils/issueEstimateByType";
import { Comment, orderComments } from "../utils/comments";
import { History } from "../utils/history";
import { useRequestDataUpdate } from "../hooks/useRequestDataUpdate";
import { useIssueHistory } from "../hooks/useIssueHistory";

type IssueContextProviderProps = {
  issueId: string;
  linearAccessToken: string;
  isLoading?: boolean;
  children: ReactNode;
};

export type IssueContextValueData = {
  me: User | null;
  meLoading: boolean;
  urlBase: string;
  issue: Issue;
  update: {
    issue: (
      issueId: string,
      issue: Parameters<LinearClient["updateIssue"]>[1],
    ) => Promise<void>;
    comments: {
      addComment: (body: string) => Promise<void>;
      updateComment: (commentId: string, body: string) => Promise<void>;
      deleteComment: (commentId: string) => Promise<void>;
      sendCommentReply: (commentId: string, body: string) => Promise<void>;
      resolveComment: (
        commentId: string,
        parentCommentId?: string,
      ) => Promise<void>;
      unresolveComment: (commentId: string) => Promise<void>;
    };
    reactions: {
      addReaction: (
        reaction: Parameters<LinearClient["createReaction"]>[0],
      ) => Promise<void>;
      removeReaction: (id: string) => Promise<void>;
    };
    panelActions: ReturnType<typeof useRequestDataUpdate>;
  };
  priorities: IssuePriorityValue[];
  prioritiesLoading: boolean;
  issueLabels: IssueLabel[];
  issueLabelsLoading: boolean;
  projects: Project[];
  projectsLoading: boolean;
  cycles: Cycle[];
  cyclesLoading: boolean;
  workflowStates: WorkflowStateWithStateProgress[];
  workflowStatesLoading: boolean;
  users: User[];
  usersLoading: boolean;
  issueEstimations: EstimateDataItem[] | null;
  issueEstimationsLoading: boolean;
  comments: Comment[] | null;
  commentsLoading: boolean;
  history: History[] | null;
  historyLoading: boolean;
  subIssues: Issue[] | null;
  subIssuesLoading: boolean;
};

const IssueContextValue = createContext<IssueContextValueData>({
  me: null,
  meLoading: false,
  urlBase: "",
  issue: {} as Issue,
  update: {
    issue: async () => Promise.reject(),
    comments: {
      addComment: async () => Promise.reject(),
      deleteComment: async () => Promise.reject(),
      updateComment: async () => Promise.reject(),
      sendCommentReply: async () => Promise.reject(),
      resolveComment: async () => Promise.reject(),
      unresolveComment: async () => Promise.reject(),
    },
    reactions: {
      addReaction: async () => Promise.reject(),
      removeReaction: async () => Promise.reject(),
    },
    panelActions: {
      closePanel: () => Promise.reject(),
      openExternal: () => Promise.reject(),
      updateIssue: () => Promise.reject(),
      openIssue: () => Promise.reject(),
      startWork: () => Promise.reject(),
      getGitStatus: () => Promise.reject(),
      getAllBranches: () => Promise.reject(),
      getCurrentBranch: () => Promise.reject(),
      createBranch: () => Promise.reject(),
      hasUncommittedChanges: () => Promise.reject(),
      checkout: () => Promise.reject(),
    },
  },
  priorities: [],
  prioritiesLoading: false,
  issueLabels: [],
  issueLabelsLoading: false,
  projects: [],
  projectsLoading: false,
  cycles: [],
  cyclesLoading: false,
  workflowStates: [],
  workflowStatesLoading: false,
  users: [],
  usersLoading: false,
  issueEstimations: null,
  issueEstimationsLoading: false,
  comments: null,
  commentsLoading: false,
  history: null,
  historyLoading: false,
  subIssues: null,
  subIssuesLoading: false,
});

export function IssueContextProvider(props: IssueContextProviderProps) {
  const {
    children,
    issueId,
    linearAccessToken,
    isLoading: externalLoading,
  } = props;

  const linearClient = useLinearClient(linearAccessToken);

  const [issue, setIssue] = useState<Issue | null>(null);
  const [commentRefetch, setCommentRefetch] = useState(0);
  const [subIssuesRefetch, setSubIssuesRefetch] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [urlBase, setUrlBase] = useState<string>("");

  async function fetchIssue(updatedAt?: number) {
    if (updatedAt && issue && issue.updatedAt.getTime() >= updatedAt) {
      return;
    }

    if (linearClient && issueId) {
      const issue = await linearClient?.issue(issueId || "");
      setIssue(issue || null);
    }
  }

  const panelActions = useRequestDataUpdate({
    updateIssue: fetchIssue,
  });

  useAsyncEffect(async () => {
    setIsLoading(true);
    try {
      await fetchIssue();
    } catch (error) {
      console.error("Failed to load issue:", error);
    } finally {
      setIsLoading(false);
    }
  }, [issueId, !!linearClient]);

  async function updateIssue(
    id: string,
    updatedFields: Parameters<LinearClient["updateIssue"]>[1],
  ) {
    try {
      const result = await linearClient?.updateIssue(id, updatedFields);
      const updatedIssue = await result?.issue;

      if (result?.success) {
        if (id === issueId) {
          setIssue(updatedIssue || null);
        } else {
          setSubIssuesRefetch((r) => r + 1);
        }

        if (updatedIssue?.id) {
          panelActions.updateIssue(updatedIssue.id);
        }
      }
    } catch (error) {
      console.error("Failed to update issue:", error);
    }
  }

  async function addComment(body: string) {
    await linearClient?.createComment({
      issueId: issueId,
      body,
    });
    setCommentRefetch((r) => r + 1);
  }

  async function updateComment(commentId: string, body: string) {
    await linearClient?.updateComment(commentId, { body });
    setCommentRefetch((r) => r + 1);
  }

  async function deleteComment(commentId: string) {
    await linearClient?.deleteComment(commentId);
    setCommentRefetch((r) => r + 1);
  }

  async function sendCommentReply(commentId: string, body: string) {
    await linearClient?.createComment({
      parentId: commentId,
      issueId: issueId,
      body,
    });
    setCommentRefetch((r) => r + 1);
  }

  async function addReaction(
    reaction: Parameters<LinearClient["createReaction"]>[0],
  ) {
    await linearClient?.createReaction(reaction);

    if (reaction.commentId) {
      setCommentRefetch((r) => r + 1);
    } else {
      fetchIssue();
    }
  }

  async function removeReaction(id: string) {
    await linearClient?.deleteReaction(id);
    fetchIssue();
  }

  async function resolveComment(
    commentId: string,
    resolvingCommentId?: string,
  ) {
    await linearClient?.commentResolve(
      commentId,
      resolvingCommentId && commentId !== resolvingCommentId
        ? { resolvingCommentId }
        : undefined,
    );
    setCommentRefetch((r) => r + 1);
  }

  async function unresolveComment(commentId: string) {
    await linearClient?.commentUnresolve(commentId);
    setCommentRefetch((r) => r + 1);
  }

  const [me, meLoading] = useAsyncMemo(async () => {
    const me = await linearClient?.viewer;
    if (!urlBase) {
      const organization = await me?.organization;
      if (organization?.urlKey) {
        setUrlBase(`https://linear.app/${organization.urlKey}`);
      }
    }
    return me || null;
  }, [!!linearClient]);

  const [priorities = [], prioritiesLoading] = useAsyncMemo(async () => {
    const priorities = await linearClient?.issuePriorityValues;
    return priorities || [];
  }, [!!linearClient]);

  const [issueLabels, issueLabelsLoading] = useAsyncMemo(async () => {
    if (!issue?.teamId) return [];
    const labels = await linearClient?.issueLabels({
      filter: {
        team: {
          or: [{ id: { eq: issue?.teamId } }, { null: true }],
        },
      },
    });
    while (labels?.pageInfo.hasPreviousPage) {
      await labels.fetchPrevious();
    }
    return labels?.nodes || [];
  }, [!!linearClient, issue?.id]);

  const [projects = [], projectsLoading] = useAsyncMemo(async () => {
    if (!issue?.teamId) return [];
    const projects = await linearClient?.projects({
      filter: { accessibleTeams: { id: { eq: issue.teamId } } },
    });
    while (projects?.pageInfo.hasPreviousPage) {
      await projects.fetchPrevious();
    }
    return projects?.nodes || [];
  }, [!!linearClient, issue?.id]);

  const [cycles = [], cyclesLoading] = useAsyncMemo(async () => {
    if (!issue?.teamId) return [];
    const cycles = await linearClient?.cycles({
      filter: { team: { id: { eq: issue.teamId } } },
    });
    while (cycles?.pageInfo.hasPreviousPage) {
      await cycles.fetchPrevious();
    }
    return cycles?.nodes || [];
  }, [!!linearClient, issue?.id]);

  const [issueEstimations, issueEstimationsLoading] =
    useAsyncMemo(async (): Promise<EstimateDataItem[] | null> => {
      if (!issue?.teamId) return null;
      const team = await linearClient?.team(issue.teamId);
      if (
        !team?.issueEstimationType ||
        team.issueEstimationType === "notUsed"
      ) {
        return null;
      }
      return createEstimateDataItems(
        team?.issueEstimationType as keyof typeof issueEstimationByType,
      );
    }, [!!linearClient, issue?.id]);

  const [workflowStates = [], workflowStatesLoading] =
    useAsyncMemo(async () => {
      if (!issue?.teamId) return [];
      const workflowStates = await linearClient?.workflowStates({
        filter: { team: { id: { eq: issue.teamId } } },
      });
      while (workflowStates?.pageInfo.hasPreviousPage) {
        await workflowStates.fetchPrevious();
      }
      return filterWorkflowStatesByType(workflowStates?.nodes || []);
    }, [!!linearClient, issue?.id]);

  const [users = [], usersLoading] = useAsyncMemo(async () => {
    const users = await linearClient?.users({ last: 100 });
    while (users?.pageInfo.hasPreviousPage) {
      await users.fetchPrevious();
    }
    return users?.nodes || [];
  }, [!!linearClient]);

  const [comments, commentsLoading] = useAsyncMemo(async () => {
    if (!issue) return [];
    const comments = await linearClient?.comments({
      filter: { issue: { id: { eq: issue.id } } },
      orderBy: PaginationOrderBy.CreatedAt,
    });
    while (comments?.pageInfo.hasPreviousPage) {
      await comments.fetchPrevious();
    }
    return orderComments(comments?.nodes || []);
  }, [!!linearClient, issue?.updatedAt.getTime(), commentRefetch]);

  const [history, historyLoading] = useIssueHistory({
    issue,
    users,
  });

  const [subIssues, subIssuesLoading] = useAsyncMemo(async () => {
    if (!issue) return [];
    const subIssues = await issue?.children({ last: 100 });
    while (subIssues?.pageInfo.hasPreviousPage) {
      await subIssues.fetchPrevious();
    }
    return subIssues?.nodes || [];
  }, [issue?.updatedAt.getTime(), subIssuesRefetch]);

  const context = useMemo(
    (): IssueContextValueData => ({
      me,
      meLoading,
      urlBase,
      issue: issue!,
      priorities: priorities || [],
      prioritiesLoading,
      issueLabels: issueLabels || [],
      issueLabelsLoading,
      projects: projects || [],
      projectsLoading,
      cycles: cycles || [],
      cyclesLoading,
      workflowStates: workflowStates || [],
      workflowStatesLoading,
      users: users || [],
      usersLoading,
      issueEstimations,
      issueEstimationsLoading,
      comments,
      commentsLoading,
      history,
      historyLoading,
      subIssues,
      subIssuesLoading,
      update: {
        issue: updateIssue,
        comments: {
          addComment,
          updateComment,
          deleteComment,
          sendCommentReply,
          resolveComment,
          unresolveComment,
        },
        reactions: {
          addReaction,
          removeReaction,
        },
        panelActions,
      },
    }),
    [
      me,
      meLoading,
      urlBase,
      issue,
      priorities,
      prioritiesLoading,
      issueLabels,
      issueLabelsLoading,
      projects,
      projectsLoading,
      cycles,
      cyclesLoading,
      workflowStates,
      workflowStatesLoading,
      users,
      usersLoading,
      issueEstimations,
      issueEstimationsLoading,
      comments,
      commentsLoading,
      history,
      historyLoading,
      subIssues,
      subIssuesLoading,
    ],
  );

  if (!issue || !linearClient || isLoading || externalLoading) {
    return <Container loading={true} />;
  }

  return (
    <IssueContextValue.Provider value={context}>
      {children}
    </IssueContextValue.Provider>
  );
}

export function useIssueContext() {
  return useContext(IssueContextValue);
}
