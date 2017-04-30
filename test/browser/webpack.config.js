const path = require('path')
const glob = require('glob')

const config = {
  entry: {
    test: glob.sync('./test/*.test.js'),
    bootstrap: './test/support/bootstrap'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.js'
  }
}

module.exports = config
