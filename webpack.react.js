const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CSSMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);
const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  mode: isProduction ? "production" : "development",
  entry: {
    main: resolveApp("./src/webviews/index.tsx"),
  },
  devtool: isProduction ? undefined : "eval-source-map",

  output: {
    publicPath: "",
    pathinfo: true,
    path: path.resolve(__dirname, "dist"),
    chunkFilename: "[name].chunk.js",
    filename: "[name].js",
    devtoolModuleFilenameTemplate: "file:///[absolute-resource-path]",
  },
  optimization: {
    minimizer: isProduction
      ? [
          new CSSMinimizerPlugin({}),
          new TerserPlugin({
            extractComments: false,
            terserOptions: {
              keep_fnames: true,
              compress: {
                comparisons: false,
              },
              output: {
                comments: false,
                ascii_only: true,
              },
            },
          }),
        ]
      : undefined,
    splitChunks: {
      cacheGroups: {
        styles: {
          name: "main",
          type: "css/mini-extract",
          chunks: "all",
          enforce: true,
        },
      },
    },
  },
  externals: ["utf-8-validate", "bufferutil", "vscode"],
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".json"],
    plugins: [
      new TsconfigPathsPlugin({ configFile: resolveApp("./tsconfig.json") }),
    ],
    fallback: {
      path: require.resolve("path-browserify"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      vm: require.resolve("vm-browserify"),
      buffer: require.resolve("buffer"),
      process: require.resolve("process"),
      "process/browser": require.resolve("process/browser"),
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      ignoreOrder: true,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /iconv-loader\.js/,
      contextRegExp: /moment$/,
    }),
    new webpack.WatchIgnorePlugin({
      paths: [/\.js$/, /\.d\.ts$/],
    }),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: resolveApp("tsconfig.json"),
      },
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
  module: {
    rules: [
      {
        // Include ts, tsx, js, and jsx files.
        test: /\.(ts|js)x?$/,
        exclude: [/node_modules/, /\.test\.ts$/, /\.spec\.ts$/],
        use: [
          {
            loader: "ts-loader",
            options: { transpileOnly: true, onlyCompileBundledFiles: true },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          isProduction
            ? {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  publicPath: "../",
                },
              }
            : "style-loader",
          {
            loader: require.resolve("css-loader"),
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          isProduction
            ? {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  publicPath: "../",
                },
              }
            : "style-loader",
          {
            loader: require.resolve("css-loader"),
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.js$/,
        use: [{ loader: "source-map-loader" }],
        enforce: "pre",
        include: /node_modules/,
      },
    ],
  },
};
