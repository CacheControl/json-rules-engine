'use strict'

const chai = require('chai')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const dirtyChai = require('dirty-chai')
chai.use(chaiAsPromised)
chai.use(sinonChai)
chai.use(dirtyChai)
global.expect = chai.expect
global.factories = {
  rule: require('./rule-factory'),
  condition: require('./condition-factory')
}
