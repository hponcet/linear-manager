import { simpleGit } from "simple-git"
import { extensions, window, workspace } from "vscode"

import { openPullRequestMultiDiff } from "./openPullRequestMultiDiff"
import { filterEvent, isDescendant, onceEvent, uniqBy } from "./utils"

import { Branch, BranchQuery, GitAPI, GitExtension, Ref, Remote, Repository } from "../types/GitAPI"

type BranchChangeOptions = {
  stashChanges?: boolean
}

export class GitClient {
  #api: GitAPI | null = null
  #repository: Repository | null = null
  #branchesCache: Map<string, Ref> | null = null
  #rootPath: string | null = null

  onStatusChange?: ({ repoActive, apiActive }: { repoActive: boolean; apiActive: boolean }) => void

  get apiActive(): boolean {
    return !!this.#api
  }

  get repositoryActive(): boolean {
    return !!this.#repository
  }

  get active(): boolean {
    return this.apiActive && this.repositoryActive
  }

  constructor(
    onStatusChange?: ({
      repoActive,
      apiActive,
    }: {
      repoActive: boolean
      apiActive: boolean
    }) => void,
  ) {
    this.onStatusChange = onStatusChange
  }

  async init(): Promise<void> {
    const gitExtension = extensions.getExtension<GitExtension>("vscode.git")?.exports
    const api = gitExtension?.getAPI(1)

    const rootPath = workspace.workspaceFolders?.[0].uri.fsPath || ""

    if (!rootPath || !api) {
      this.onStatusChange?.({ repoActive: false, apiActive: false })
      return
    }

    const repository = api.repositories.filter((r) => isDescendant(r.rootUri.fsPath, rootPath))[0]

    if (repository) {
      this.#api = api
      this.#repository = repository
      this.#rootPath = rootPath
      this.onStatusChange?.({ repoActive: true, apiActive: true })
    } else {
      this.onStatusChange?.({ repoActive: false, apiActive: true })
      const onDidOpenRelevantRepository = filterEvent(api.onDidOpenRepository, (r) =>
        isDescendant(r.rootUri.fsPath, rootPath),
      )
      onceEvent(onDidOpenRelevantRepository)((r) => {
        this.#api = api
        this.#repository = r
        this.#rootPath = rootPath
        this.onStatusChange?.({ repoActive: true, apiActive: true })
      })
    }
  }

  getGitStatus(): { repoActive: boolean; apiActive: boolean } {
    return {
      repoActive: this.repositoryActive,
      apiActive: this.apiActive,
    }
  }

  getCurrentBranch(): Branch | null {
    if (!this.#repository) {
      throw new Error("No repository available")
    }
    return this.#repository.state.HEAD || null
  }

  getOriginRemote(): Remote | null {
    if (!this.#repository) {
      return null
    }

    const remotes = this.#repository.state.remotes
    const origin = remotes.find((remote) => remote.name === "origin")
    return origin ?? remotes.find((remote) => remote.fetchUrl || remote.pushUrl) ?? null
  }

  getDefaultBranch(): string {
    const preferred = ["main", "master"]

    if (this.#branchesCache) {
      for (const branchName of preferred) {
        if (this.#branchesCache.has(branchName)) {
          return branchName
        }
      }
    }

    const head = this.#repository?.state.HEAD?.name
    if (head && !head.includes("HEAD")) {
      return head
    }

    return "main"
  }

  async getBranches(query: BranchQuery): Promise<Ref[]> {
    if (!this.#repository) {
      throw new Error("No repository available")
    }

    try {
      await this.#repository.fetch({ all: true, prune: true })

      const branches = uniqBy(
        (await this.#repository.getBranches(query))
          .map((b) => ({
            ...b,
            name: b.name?.replace("origin/", "") || b.name,
          }))
          .sort((a, b) => (a.remote === b.remote ? 0 : a.remote ? 1 : -1))
          .sort((a, b) => a.name!.localeCompare(b.name!)) || [],
        (i) => i.name || "",
      )
      this.#branchesCache = new Map(branches.map((b) => [b.name || "", b]))

      return branches
    } catch (error) {
      if (error.stderr) {
        window.showErrorMessage(error.stderr || "Failed to get branches")
      }
      throw new Error(error.stderr || "Failed to get branches")
    }
  }

  async hasUncommittedChanges(): Promise<boolean> {
    if (!this.#repository) {
      throw new Error("No repository available")
    }
    await this.#repository.status()
    return (
      this.#repository.state.indexChanges.length > 0 ||
      this.#repository.state.workingTreeChanges.length > 0 ||
      this.#repository.state.mergeChanges.length > 0
    )
  }

  async checkout(branch: Ref, options?: BranchChangeOptions): Promise<void> {
    return this.withOptionalStash(() => this.checkoutBranch(branch), options)
  }

  private async checkoutBranch(branch: Ref, retry?: boolean): Promise<void> {
    if (!this.#repository) {
      throw new Error("No repository available")
    }

    try {
      if (!branch.remote) {
        await this.#repository.checkout(branch.name || "")
      } else {
        await this.createBranchFromRef(branch.name || "", branch)
      }
    } catch (error) {
      if (error.stderr) {
        if (error.stderr.includes("not match any file")) {
          if (!retry) {
            // This error can happen when trying to checkout a branch that was just created remotely and not fetched locally yet
            // In this case, we can try to fetch and checkout again
            await this.#repository?.fetch({ all: true, prune: true })
            return this.checkoutBranch(branch, true)
          }
        }

        window.showErrorMessage(error.stderr || "Failed to switch to branch")
      }
      throw new Error(error.stderr || "Failed to switch to branch")
    }
  }

  async createBranch(branchName: string, from: Ref, options?: BranchChangeOptions): Promise<Ref> {
    return this.withOptionalStash(() => this.createBranchFromRef(branchName, from), options)
  }

  private async createBranchFromRef(branchName: string, from: Ref): Promise<Ref> {
    try {
      if (!this.#repository) {
        throw new Error("No repository available")
      }
      await this.#repository.createBranch(branchName, true, from.commit)
      return this.getCurrentBranch()!
    } catch (error) {
      if (error.stderr) {
        window.showErrorMessage(error.stderr || "Failed to create branch")
      }
      throw new Error(error.stderr || "Failed to create branch")
    }
  }

  private async withOptionalStash<T>(
    operation: () => Promise<T>,
    options?: BranchChangeOptions,
  ): Promise<T> {
    if (!options?.stashChanges || !(await this.hasUncommittedChanges())) {
      return operation()
    }

    const stashRef = await this.createStash()

    try {
      const result = await operation()
      await this.applyStash(stashRef)
      await this.dropStash(stashRef)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(
        `${message}\n\nYour changes were saved in ${stashRef}. Resolve the issue and apply it manually if needed.`,
      )
    }
  }

  private getSimpleGit() {
    if (!this.#rootPath) {
      throw new Error("No repository available")
    }

    return simpleGit(this.#rootPath)
  }

  private async createStash(): Promise<string> {
    const git = this.getSimpleGit()
    const stashMessage = `linear-manager-start-work-${Date.now()}`

    await git.stash(["push", "--include-untracked", "-m", stashMessage])

    const stashList = await git.stash(["list", "--format=%gd%x00%s"])
    const stashLine = stashList
      .split("\n")
      .find((line) => line.includes(stashMessage))
      ?.split("\0")[0]

    if (!stashLine) {
      throw new Error("Failed to create stash")
    }

    return stashLine
  }

  private async applyStash(stashRef: string): Promise<void> {
    await this.getSimpleGit().stash(["apply", "--index", stashRef])
  }

  private async dropStash(stashRef: string): Promise<void> {
    await this.getSimpleGit().stash(["drop", stashRef])
  }

  async openPullRequestMultiDiff(options: {
    sourceBranch: string
    targetBranch: string
    title?: string
  }): Promise<void> {
    if (!this.#repository || !this.#api) {
      throw new Error("No git repository available")
    }

    await openPullRequestMultiDiff({
      repository: this.#repository,
      api: this.#api,
      ...options,
    })
  }

  async branchExists(branchName: string): Promise<Ref | null> {
    if (!this.#repository) {
      throw new Error("No repository available")
    }

    if (!this.#branchesCache) {
      await this.getBranches({})
    }

    return (
      Array.from(this.#branchesCache!.values()).find(
        (ref) => (ref.remote ? `origin/${ref.name}` : ref.name) === branchName,
      ) || null
    )
  }

  dispose() {
    this.#api = null
    this.#repository = null
    this.#branchesCache = null
    this.#rootPath = null
  }
}
