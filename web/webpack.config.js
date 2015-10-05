var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    code: './app.tsx',
    /* 'autocomplete-demo': './autocomplete-demo.tsx', */
  },
  // devtool: 'source-map',
  output: {
    path: 'build',
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader',
                                          'css-loader!sass-loader') }
    ],
  },
  resolve: {
    extensions: ['', '.ts', '.tsx', '.scss']
  },
  plugins: [
    /* new webpack.optimize.UglifyJsPlugin({minimize:true}), */
    new ExtractTextPlugin('[name].css'),
  ],
  externals: {
    'react': 'React'
  }
}
