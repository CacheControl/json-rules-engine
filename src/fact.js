'use strict'

import hash from 'object-hash'

class Fact {
  constructor (id, options = { cache: true }) {
    this.id = id
    this.options = options
  }

  definition (calculate, initialValue = undefined) {
    this.calculate = calculate
    this.value = initialValue
  }

  getCacheKey (params) {
    if (this.options.cache === true) {
      return hash({ params, id: this.id })
    }
  }
}

export default Fact
