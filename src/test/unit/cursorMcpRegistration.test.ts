import * as assert from "assert"

import { ExtensionContext } from "vscode"

import {
  createCursorMcpServerConfig,
  MCP_CURSOR_SERVER_NAME,
  MCP_SERVER_LABEL,
} from "../../mcp/mcpEnvBuilder"

suite("createCursorMcpServerConfig", () => {
  test("registers the bundled stdio server with Linear credentials", () => {
    const context = {
      asAbsolutePath: (relativePath: string) => `/extension/${relativePath}`,
    } as ExtensionContext

    const config = createCursorMcpServerConfig(context, {
      LINEAR_ACCESS_TOKEN: "token-123",
      WORKSPACE_FOLDER: "/workspace/project",
    })

    assert.strictEqual(config.name, MCP_CURSOR_SERVER_NAME)
    assert.strictEqual(config.name, MCP_SERVER_LABEL)
    assert.strictEqual(config.server.command, "node")
    assert.deepStrictEqual(config.server.args, ["/extension/dist/linearMcpServer.js"])
    assert.strictEqual(config.server.env.LINEAR_ACCESS_TOKEN, "token-123")
    assert.strictEqual(config.server.env.WORKSPACE_FOLDER, "/workspace/project")
  })
})
