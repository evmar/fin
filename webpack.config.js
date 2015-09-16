var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    code: './web/app.tsx',
    'autocomplete-demo': './web/autocomplete-demo.jsx',
  },
  // devtool: 'source-map',
  output: {
    path: 'build',
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.jsx$/, loader: 'jsx-loader?harmony' },
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader',
                                          'css-loader!sass-loader') }
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.ts', '.tsx', '.scss']
  },
  plugins: [
    // new webpack.optimize.UglifyJsPlugin({minimize:true}),
    new ExtractTextPlugin('[name].css'),
  ],
  externals: {
    'react': 'React'
  }
}
