import { ExtensionContext, authentication, window } from "vscode";
import { LinearClient } from "@linear/sdk";
import { CommandContext, setCommandContext } from "../commandsContext";
import { Controller } from "src/controller";

let linearClient: LinearClient | null = null;

export enum LinearSecretKeys {
  accessToken = "linearAccessToken",
}

export async function initLinearClient(
  context: ExtensionContext,
): Promise<void> {
  try {
    const accessToken = await context.secrets.get(LinearSecretKeys.accessToken);

    if (accessToken) {
      linearClient = new LinearClient({
        accessToken,
        headers: {
          "public-file-urls-expire-in": "60",
        },
      });
      setCommandContext(CommandContext.linearAccountConnected, true);
      await Controller.initialize(context);
    } else {
      setCommandContext(CommandContext.linearAccountConnected, false);
    }
  } catch (error) {
    window.showErrorMessage(
      `Failed to initialize Linear client: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    setCommandContext(CommandContext.linearAccountConnected, false);
  }
}

export async function linearConnect(context: ExtensionContext) {
  try {
    const session = await authentication.getSession(
      "linear",
      ["read", "write"],
      { createIfNone: true },
    );

    if (session) {
      context.secrets.store(LinearSecretKeys.accessToken, session.accessToken);

      linearClient = new LinearClient({
        accessToken: session.accessToken,
        headers: {
          "public-file-urls-expire-in": "60",
        },
      });

      await Controller.initialize(context);
      setCommandContext(CommandContext.linearAccountConnected, true);
      window.showInformationMessage("Successfully connected to Linear API");
    } else {
      window.showErrorMessage("Failed to acquire a Linear API session.");
      setCommandContext(CommandContext.linearAccountConnected, false);
    }
  } catch (error) {
    window.showErrorMessage(
      `Failed to connect to Linear API: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    setCommandContext(CommandContext.linearAccountConnected, false);
  }
}

export async function linearDisconnect(context: ExtensionContext) {
  await context.secrets.delete(LinearSecretKeys.accessToken);
  linearClient = null;
  Controller.dispose();
  setCommandContext(CommandContext.linearAccountConnected, false);
  window.showInformationMessage("Successfully disconnected from Linear API");
}

export function getLinearClient(): LinearClient | null {
  return linearClient;
}
