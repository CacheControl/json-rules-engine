'use strict'

let chai = require('chai')
let sinonChai = require('sinon-chai')
let chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.use(sinonChai)

global.expect = chai.expect
global.factories = {
  rule: require('./rule-factory')
}
