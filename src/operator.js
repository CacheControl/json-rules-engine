'use strict'

export default class Operator {
  constructor (name, cb) {
    this.name = String(name)
    if (!name) throw new Error('Missing operator name')
    if (typeof cb !== 'function') throw new Error('Missing operator callback')
    this.cb = cb
  }
}
