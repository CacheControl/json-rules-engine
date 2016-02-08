'use strict'

import Engine from './engine'
import Fact from './fact'
import Rule from './rule'

export { Fact, Rule }
export default function (rules) {
  return new Engine(rules)
}
