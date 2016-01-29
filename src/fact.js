'use strict'

import hash from 'object-hash'

class Fact {
  constructor (id, options = {}) {
    this.id = id
    this.options = options
  }

  definition (calculate, initialValue = undefined) {
    this.calculate = calculate
    this.value = initialValue
  }

  getCacheKey (params) {
    return hash({ params, id: this.id })
  }
}

export default Fact
