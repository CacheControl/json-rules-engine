'use strict'

import { Pipe } from '../src/index'

describe('Pipe', () => {
  describe('constructor()', () => {
    function subject (...args) {
      return new Pipe(...args)
    }

    it('adds the pipe', () => {
      const scalePipe = subject('scale', (factValue, factor) => {
        return factValue * factor
      })
      expect(scalePipe.name).to.equal('scale')
      expect(scalePipe.cb).to.an.instanceof(Function)
    })

    it('pipe name', () => {
      expect(() => {
        subject()
      }).to.throw(/Missing pipe name/)
    })

    it('pipe definition', () => {
      expect(() => {
        subject('scale')
      }).to.throw(/Missing pipe callback/)
    })
  })
})
