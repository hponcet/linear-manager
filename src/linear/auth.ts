import { ExtensionContext, authentication, window } from "vscode";
import { LinearClient } from "@linear/sdk";
import { CommandContext, setCommandContext } from "../commandsContext";

let linearClient: LinearClient | null = null;

enum LinearSecretKeys {
  accessToken = "linearAccessToken",
}

export async function initLinearClient(
  context: ExtensionContext
): Promise<boolean> {
  try {
    const accessToken = await context.secrets.get(LinearSecretKeys.accessToken);
    if (accessToken) {
      linearClient = new LinearClient({ accessToken });
      return true;
    }
  } catch (error) {
    window.showErrorMessage(
      `Failed to initialize Linear client: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  setCommandContext(CommandContext.linearAccountConnected, false);
  return false;
}

export async function linearConnect(context: ExtensionContext) {
  window.showInformationMessage("Trying to connect to Linear API!");

  const session = await authentication.getSession(
    "linear", // Linear VS Code authentication provider ID
    ["read", "write"], // OAuth scopes we're requesting
    { createIfNone: true }
  );

  if (session) {
    context.secrets.store(LinearSecretKeys.accessToken, session.accessToken);

    linearClient = new LinearClient({
      accessToken: session.accessToken,
    });

    setCommandContext(CommandContext.linearAccountConnected, true);

    window.showInformationMessage("Successfully connected to Linear API!");
  } else {
    window.showErrorMessage("Failed to acquire a Linear API session.");
  }
}

export function getLinearClient(): LinearClient | null {
  return linearClient;
}
