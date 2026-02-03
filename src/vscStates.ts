import { Issue } from "@linear/sdk";
import { Ref } from "./types/GitAPI";

export enum VscStateKeys {
  issueSettings = "issueSettings",
  branchesSettings = "branchesSettings",
}

export type IssueLabelSetting = {
  color: string;
  id: string;
  name: string;
};

export type IssueVscState = Record<
  Issue["id"],
  Partial<{
    branch: Ref;
    branchInitialized: boolean;
    ignoredBranches: string[];
  }>
>;

export type SettingsVscState = {
  updateCycle?: boolean;
  prefixByLabel?: boolean;
  prefixByLabelList?: { label: IssueLabelSetting; prefix: string }[];
  uppercaseIssueIdentifier?: boolean;
};
