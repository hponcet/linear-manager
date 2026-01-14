import path from "path";
import { ExtensionContext, Uri } from "vscode";

export class Resources {
  public icons = new Map<string, Uri>();

  constructor(context: ExtensionContext) {
    const imagesPath = path.join("resources", "images");
    const statuesPath = path.join(imagesPath, "statues");

    this.icons.set(
      "issue",
      Uri.file(context.asAbsolutePath(path.join(imagesPath, "issue.svg")))
    );
    this.icons.set(
      "treeIssue",
      Uri.file(context.asAbsolutePath(path.join(imagesPath, "tree-issue.svg")))
    );
    this.icons.set(
      "linear",
      Uri.file(context.asAbsolutePath(path.join(imagesPath, "linear.svg")))
    );

    this.icons.set(
      "backlog",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "backlog.svg")))
    );
    this.icons.set(
      "canceled",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "canceled.svg")))
    );
    this.icons.set(
      "completed",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "completed.svg")))
    );
    this.icons.set(
      "unstarted",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "unstarted.svg")))
    );

    this.icons.set(
      "started0",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started0.svg")))
    );
    this.icons.set(
      "started1",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started1.svg")))
    );
    this.icons.set(
      "started2",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started2.svg")))
    );
    this.icons.set(
      "started3",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started3.svg")))
    );
    this.icons.set(
      "started4",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started4.svg")))
    );
    this.icons.set(
      "started5",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started5.svg")))
    );
    this.icons.set(
      "started6",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started6.svg")))
    );
    this.icons.set(
      "started7",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started7.svg")))
    );
    this.icons.set(
      "started8",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started8.svg")))
    );
    this.icons.set(
      "started9",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "started9.svg")))
    );

    this.icons.set(
      "triage",
      Uri.file(context.asAbsolutePath(path.join(statuesPath, "triage.svg")))
    );
  }
}
