import { Issue } from "@linear/sdk";
import { IssueVscState, VscStateKeys } from "src/vscStates";
import { ExtensionContext, Memento } from "vscode";

export class Stores {
  #workspace: Memento;

  constructor(context: ExtensionContext) {
    this.#workspace = context.globalState;
  }

  issuesStore() {
    return {
      state: this.#workspace,
      getAll(): IssueVscState {
        return this.state.get<IssueVscState>(VscStateKeys.issueSettings) || {};
      },
      get(issueId?: Issue["id"]): IssueVscState[string] {
        if (!issueId) return {};
        return this.getAll()[issueId] || {};
      },
      async set(
        issueId: Issue["id"],
        value:
          | IssueVscState[string]
          | ((value: IssueVscState[string]) => IssueVscState[string]),
      ) {
        if (!issueId) return {};

        const store = this.getAll();

        const newValue =
          typeof value === "function" ? value(store[issueId] || {}) : value;

        await this.state.update(VscStateKeys.issueSettings, {
          ...store,
          [issueId]: { ...store[issueId], ...newValue },
        });
        return this.getAll()[issueId];
      },
      async delete(issueId: Issue["id"]) {
        if (!issueId) return {};

        const store = this.getAll();
        delete store[issueId];
        await this.state.update(VscStateKeys.issueSettings, store);
        return {};
      },
    };
  }
}
