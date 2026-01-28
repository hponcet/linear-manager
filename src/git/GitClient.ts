import { extensions, window, workspace } from "vscode";
import {
  Branch,
  BranchQuery,
  GitAPI,
  GitExtension,
  Ref,
  Repository,
} from "../types/GitAPI";
import { filterEvent, isDescendant, onceEvent, uniqBy } from "./utils";

export class GitClient {
  #api: GitAPI | null = null;
  #repository: Repository | null = null;
  #branchesCache: Map<string, Ref> | null = null;

  onStatusChange?: ({
    repoActive,
    apiActive,
  }: {
    repoActive: boolean;
    apiActive: boolean;
  }) => void;

  get apiActive(): boolean {
    return !!this.#api;
  }

  get repositoryActive(): boolean {
    return !!this.#repository;
  }

  get active(): boolean {
    return this.apiActive && this.repositoryActive;
  }

  constructor(
    onStatusChange?: ({
      repoActive,
      apiActive,
    }: {
      repoActive: boolean;
      apiActive: boolean;
    }) => void,
  ) {
    this.onStatusChange = onStatusChange;
  }

  async init(): Promise<void> {
    const gitExtension =
      extensions.getExtension<GitExtension>("vscode.git")?.exports;
    const api = gitExtension?.getAPI(1);

    const rootPath = workspace.workspaceFolders?.[0].uri.fsPath || "";

    if (!rootPath || !api) {
      this.onStatusChange?.({ repoActive: false, apiActive: false });
      return;
    }

    const repository = api.repositories.filter((r) =>
      isDescendant(r.rootUri.fsPath, rootPath),
    )[0];

    if (repository) {
      this.#api = api;
      this.#repository = repository;
      this.onStatusChange?.({ repoActive: true, apiActive: true });
    } else {
      this.onStatusChange?.({ repoActive: false, apiActive: true });
      const onDidOpenRelevantRepository = filterEvent(
        api.onDidOpenRepository,
        (r) => isDescendant(r.rootUri.fsPath, rootPath),
      );
      onceEvent(onDidOpenRelevantRepository)((r) => {
        this.#api = api;
        this.#repository = r;
        this.onStatusChange?.({ repoActive: true, apiActive: true });
      });
    }
  }

  getGitStatus(): { repoActive: boolean; apiActive: boolean } {
    return {
      repoActive: this.repositoryActive,
      apiActive: this.apiActive,
    };
  }

  getCurrentBranch(): Branch | null {
    if (!this.#repository) {
      throw new Error("No repository available");
    }
    return this.#repository.state.HEAD || null;
  }

  async getBranches(query: BranchQuery): Promise<Ref[]> {
    if (!this.#repository) {
      throw new Error("No repository available");
    }

    try {
      await this.#repository.fetch({ all: true, prune: true });

      const branches = uniqBy(
        (await this.#repository.getBranches(query))
          .map((b) => ({
            ...b,
            name: b.name?.replace("origin/", "") || b.name,
          }))
          .sort((a, b) => (a.remote === b.remote ? 0 : a.remote ? 1 : -1))
          .sort((a, b) => a.name!.localeCompare(b.name!)) || [],
        (i) => i.name || "",
      );
      this.#branchesCache = new Map(branches.map((b) => [b.name || "", b]));

      return branches;
    } catch (error) {
      if (error.stderr) {
        window.showErrorMessage(error.stderr || "Failed to get branches");
      }
      throw new Error(error.stderr || "Failed to get branches");
    }
  }

  async hasUncommittedChanges(): Promise<boolean> {
    if (!this.#repository) {
      throw new Error("No repository available");
    }
    return this.#repository.state.workingTreeChanges.length > 0;
  }

  async checkout(branch: Ref): Promise<boolean> {
    if (!this.#repository) {
      throw new Error("No repository available");
    }

    try {
      if (!branch.remote) {
        await this.#repository.checkout(branch.name || "");
      } else {
        await this.createBranch(branch.name || "", branch);
      }
      return true;
    } catch (error) {
      if (error.stderr) {
        window.showErrorMessage(error.stderr || "Failed to checkout branch");
      }
      throw new Error(error.stderr || "Failed to checkout branch");
    }
  }

  async createBranch(branchName: string, from: Ref): Promise<Ref> {
    try {
      if (!this.#repository) {
        throw new Error("No repository available");
      }
      await this.#repository.createBranch(branchName, true, from.commit);
      return this.getCurrentBranch()!;
    } catch (error) {
      if (error.stderr) {
        window.showErrorMessage(error.stderr || "Failed to create branch");
      }
      throw new Error(error.stderr || "Failed to create branch");
    }
  }

  async branchExists(branchName: string): Promise<Ref | null> {
    if (!this.#repository) {
      throw new Error("No repository available");
    }

    if (!this.#branchesCache) {
      await this.getBranches({});
    }

    return (
      Array.from(this.#branchesCache!.values()).find(
        (ref) => (ref.remote ? `origin/${ref.name}` : ref.name) === branchName,
      ) || null
    );
  }

  dispose() {
    this.#api = null;
    this.#repository = null;
    this.#branchesCache = null;
  }
}
