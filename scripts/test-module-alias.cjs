const Module = require("module")
const path = require("path")

const outDir = path.join(__dirname, "..", "out")
const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("src/")) {
    const mapped = path.join(outDir, request.slice(4))
    return originalResolveFilename.call(this, mapped, parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

module.exports = {}
