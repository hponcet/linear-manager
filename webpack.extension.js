//@ts-check

"use strict"

const fs = require("fs")
const path = require("path")

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const webpack = require("webpack")

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const appDirectory = fs.realpathSync(process.cwd())
//@ts-ignore
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)

const isProduction = process.env.NODE_ENV === "production"

/** @type WebpackConfig */
const extensionConfig = {
  target: "node",
  mode: "none",

  devtool: isProduction ? "nosources-source-map" : "eval-source-map",

  entry: {
    extension: resolveApp("./src/extension.ts"),
    linearToCodeMcpServer: resolveApp("./src/mcp/linearToCodeMcpServer.ts"),
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    libraryTarget: "commonjs2",
  },
  externals: {
    vscode: "commonjs vscode",
  },

  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
  ],

  resolve: {
    extensions: [".ts", ".js"],
    plugins: [
      // @ts-ignore
      new TsconfigPathsPlugin({ configFile: resolveApp("./tsconfig.json") }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: "ts-loader",
            options: { transpileOnly: true, onlyCompileBundledFiles: true },
          },
        ],
      },
    ],
  },
  infrastructureLogging: {
    level: "log",
  },
}
module.exports = [extensionConfig]
