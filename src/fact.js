'use strict'

class Fact {
  constructor (options = {}) {
    this.options = options
  }

  definition (calculate, initialValue = undefined) {
    this.calculate = calculate
    this.value = initialValue
  }
}

export default Fact
