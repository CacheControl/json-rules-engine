'use strict'

class Rule {
  constructor (options = {}) {
    this.options = options
  }

  setConditions (conditions) {
    this.conditions = conditions
  }

  setAction (action) {
    this.action = action
  }
}

export default Rule
