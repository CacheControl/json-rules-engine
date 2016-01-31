'use strict'

import Engine from './engine'
import Fact from './fact'

export { Fact }
export default function (set) {
  return new Engine(set)
}
