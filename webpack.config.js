const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  output: {
    library: "ProcessingVideo",
    libraryTarget: "umd",
    libraryExport: "default", // 增加这个属性
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
