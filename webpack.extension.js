//@ts-check

"use strict";

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const fs = require("fs");
const path = require("path");

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const appDirectory = fs.realpathSync(process.cwd());
//@ts-ignore
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

/** @type WebpackConfig */
const extensionConfig = {
  target: "node",
  mode: "none",

  entry: {
    extension: resolveApp("./src/extension.ts"),
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    libraryTarget: "commonjs2",
  },
  externals: {
    vscode: "commonjs vscode",
  },
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
  devtool: "nosources-source-map",
  infrastructureLogging: {
    level: "log",
  },
};
module.exports = [extensionConfig];
