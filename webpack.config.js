const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    background: './src/background/background.ts',
    content: './src/content/content.ts',
    popup: './src/popup/popup.ts',
    settings: './src/popup/settings.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      type: 'module'
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  experiments: {
    outputModule: true
  },
  devtool: 'source-map',
  optimization: {
    minimize: false,
    usedExports: false
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'assets/icons', to: 'assets/icons' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/popup/settings.html', to: 'settings.html' }
      ],
    }),
  ],
}; 