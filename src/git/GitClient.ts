import { extensions, workspace } from "vscode";
import {
  Branch,
  BranchQuery,
  GitAPI,
  GitExtension,
  Ref,
  Repository,
} from "../types/GitAPI";
import { CommandContext, setCommandContext } from "../commandsContext";
import { filterEvent, isDescendant, onceEvent } from "./utils";

export class GitClient {
  private _api: GitAPI | null = null;
  private _repository: Repository | null = null;

  get active(): boolean {
    return !!this._api && !!this._repository;
  }

  constructor() {
    setCommandContext(CommandContext.gitExtensionLoaded, false);
  }

  async init(): Promise<void> {
    const gitExtension =
      extensions.getExtension<GitExtension>("vscode.git")?.exports;
    const api = gitExtension?.getAPI(1);

    const rootPath = workspace.workspaceFolders?.[0].uri.fsPath || "";

    if (!rootPath || !api) {
      setCommandContext(CommandContext.gitExtensionLoaded, false);
      return;
    }

    const repository = api.repositories.filter((r) =>
      isDescendant(r.rootUri.fsPath, rootPath)
    )[0];

    if (repository) {
      setCommandContext(CommandContext.gitExtensionLoaded, true);
      this._api = api;
      this._repository = repository;
    } else {
      const onDidOpenRelevantRepository = filterEvent(
        api.onDidOpenRepository,
        (r) => isDescendant(r.rootUri.fsPath, rootPath)
      );
      onceEvent(onDidOpenRelevantRepository)((r) => {
        this._api = api;
        this._repository = r;
        setCommandContext(CommandContext.gitExtensionLoaded, true);
      });
    }
  }

  getCurrentBranch(): Branch | null {
    if (!this._repository) {
      return null;
    }

    return this._repository.state.HEAD || null;
  }

  async getBranches(query: BranchQuery): Promise<Ref[]> {
    if (!this._repository) {
      return [];
    }
    return this._repository.getBranches(query);
  }

  async hasUncommittedChanges(): Promise<boolean> {
    if (!this._repository) {
      return false;
    }
    return this._repository.state.workingTreeChanges.length > 0;
  }

  async checkout(branchName: string): Promise<void> {
    if (!this._repository) {
      return;
    }
    return this._repository.checkout(branchName);
  }

  async createBranch(branchName: string, from: Ref): Promise<void> {
    if (!this._repository) {
      return;
    }
    return this._repository.createBranch(branchName, true, from.commit);
  }
}
