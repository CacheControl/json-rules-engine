'use strict'

let chai = require('chai')
let sinonChai = require('sinon-chai')
let chaiAsPromised = require('chai-as-promised')
let dirtyChai = require('dirty-chai')
chai.use(chaiAsPromised)
chai.use(sinonChai)
chai.use(dirtyChai)
global.expect = chai.expect
global.factories = {
  rule: require('./rule-factory'),
  condition: require('./condition-factory')
}
