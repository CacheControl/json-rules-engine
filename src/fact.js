'use strict'

class Fact {
  constructor (options = {}) {
    this.options = options
  }

  definition (cb, initialValue = undefined) {
    this.cb = cb
    this.value = initialValue
  }
}

export default Fact
