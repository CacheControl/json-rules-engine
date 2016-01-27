'use strict'

let chai = require('chai')
let sinonChai = require('sinon-chai')
chai.use(sinonChai)

global.expect = chai.expect
global.factories = {
  rule: require('./rule-factory')
}
