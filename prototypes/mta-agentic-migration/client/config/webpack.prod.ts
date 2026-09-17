import path from "path";

import CopyPlugin from "copy-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { Configuration, EnvironmentPlugin } from "webpack";
import { merge } from "webpack-merge";

import { brandingAssetPath } from "@konveyor-ui/common";

import { stylePaths } from "./stylePaths";
import commonWebpackConfiguration from "./webpack.common";

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);
const faviconPath = path.resolve(brandingAssetPath(), "favicon.ico");
const publicPath = process.env.PUBLIC_PATH || "/";
const encodedEnv = btoa(
  JSON.stringify({
    NODE_ENV: "production",
    VERSION: "99.0.0",
    MOCK: process.env.MOCK || "full",
    DEVTOOLS: "off",
    UI_INGRESS_PROXY_BODY_SIZE: "500m",
    RWX_SUPPORTED: "true",
    AUTH_REQUIRED: "false",
    OIDC_CLIENT_ID: "web-ui",
  }),
);

const config = merge<Configuration>(commonWebpackConfiguration, {
  mode: "production",
  devtool: "nosources-source-map", // used to map stack traces on the client without exposing all of the source code
  output: {
    filename: "[name].[contenthash:8].min.js",
    chunkFilename: "js/[name].[chunkhash:8].min.js",
    assetModuleFilename: "assets/[name].[contenthash:8][ext]",
    publicPath,
  },

  optimization: {
    minimize: true,
    minimizer: [
      "...", // The '...' string represents the webpack default TerserPlugin instance
      new CssMinimizerPlugin(),
    ],
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        include: [...stylePaths],
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },

  plugins: [
    // Only used when the MOCK env var is set at container runtime (e.g. for demos);
    // harmless to ship otherwise since it is never registered unless MOCK is enabled.
    new CopyPlugin({
      patterns: [
        {
          from: pathTo("../public/mockServiceWorker.js"),
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash:8].css",
      chunkFilename: "css/[name].[chunkhash:8].min.css",
    }),
    new CssMinimizerPlugin({
      minimizerOptions: {
        preset: ["default", { mergeLonghand: false }],
      },
    }),
    new EnvironmentPlugin({
      NODE_ENV: "production",
    }),

    // Static GitHub Pages build: bake the mock environment into index.html.
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: pathTo("../public/index.html.ejs"),
      templateParameters: {
        _env: encodedEnv,
        branding: {
          application: {
            title: "Konveyor",
            description: "Migration Toolkit for Applications",
            name: "Konveyor",
          },
        },
        publicPath,
      },
      favicon: faviconPath,
      minify: {
        collapseWhitespace: false,
        keepClosingSlash: true,
        minifyJS: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
      },
    }),
  ],
});

export default config;
