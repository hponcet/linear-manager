import { LinearClient } from "@linear/sdk";
import { Extension } from "vscode";

export type LinearManagerExtension = Extension<{
  linearClient: LinearClient | null;
  state: "connected" | "disconnected";
}>;
