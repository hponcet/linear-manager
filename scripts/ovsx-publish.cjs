const { execSync } = require("node:child_process")
const { resolve } = require("node:path")

const { config } = require("dotenv")

config({ path: resolve(__dirname, "../.env") })

if (!process.env.OVSX_PAT) {
  console.error(
    "Missing OVSX_PAT in .env. Create .env with OVSX_PAT=... (token from https://open-vsx.org/ → Profile → Access Tokens).",
  )
  process.exit(1)
}

execSync("npx ovsx publish", { stdio: "inherit", env: process.env })
