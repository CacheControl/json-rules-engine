'use strict'

import Engine from './engine'
import Fact from './fact'
import Rule from './rule'

export { Fact, Rule }
export default function (set) {
  return new Engine(set)
}
