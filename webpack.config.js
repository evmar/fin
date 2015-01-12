var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: "./web/code.coffee",
  devtool: "source-map",
  output: {
    path: "build",
    filename: "code.js"
  },
  module: {
    loaders: [
      { test: /\.coffee$/, loader: "coffee-loader" },
      { test: /\.jsx$/, loader: "jsx-loader?harmony" },
      { test: /\.scss$/,
        loader: ExtractTextPlugin.extract("style-loader",
                                          "css-loader!sass-loader") }
    ]
  },
  resolve: {
    extensions: ["", ".coffee", ".js", ".jsx", ".scss"]
  },
  plugins: [
    //new webpack.optimize.UglifyJsPlugin({minimize:true})
    new ExtractTextPlugin("style2.css")
  ]
}
