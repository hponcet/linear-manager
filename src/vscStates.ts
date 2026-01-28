import { Issue } from "@linear/sdk";
import { Ref } from "./types/GitAPI";

export enum VscStateKeys {
  issueSettings = "issueSettings",
}

export type IssueVscState = Record<
  Issue["id"],
  Partial<{
    branch: Ref;
    branchInitialized: boolean;
    ignoredBranches: string[];
  }>
>;
