var webpack = require("webpack");

module.exports = {
  entry: "./web/code.coffee",
  devtool: "source-map",
  output: {
    path: "build",
    filename: "code.js"
  },
  module: {
    loaders: [
      { test: /\.coffee$/, loader: "coffee-loader" }
    ]
  },
  resolve: {
    extensions: ["", ".web.coffee", ".web.js", ".coffee", ".js"]
  },
  plugins: [
    //new webpack.optimize.UglifyJsPlugin({minimize:true})
  ]
}
