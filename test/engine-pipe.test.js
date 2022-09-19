'use strict'

import sinon from 'sinon'
import engineFactory from '../src/index'

async function dictionary (params, engine) {
  const words = ['coffee', 'Aardvark', 'impossible', 'ladder', 'antelope']
  return words[params.wordIndex]
}

describe('Engine: pipe', () => {
  let sandbox
  before(() => {
    sandbox = sinon.createSandbox()
  })
  afterEach(() => {
    sandbox.restore()
  })
  const event = {
    type: 'pipeTrigger'
  }
  const baseConditions = {
    any: [{
      fact: 'dictionary',
      operator: 'equal',
      value: null,
      params: {
        wordIndex: null
      },
      pipes: [
          { name: 'lower' },
          { name: 'padEnd', args: [8, '*'] }
      ]
    }]
  }
  let eventSpy
  function setup (conditions = baseConditions) {
    eventSpy = sandbox.spy()
    const engine = engineFactory()
    const rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.addPipe('padEnd', (factValue, maxLength, fillString = ' ') => {
      return factValue.padEnd(maxLength, fillString)
    })
    engine.addFact('dictionary', dictionary)
    engine.on('success', eventSpy)
    return engine
  }

  describe('evaluation', () => {
    describe('word length is less than the maxLength arg', () => {
      it('succeeds and emits', async () => {
        const conditions = Object.assign({}, baseConditions)
        conditions.any[0].params.wordIndex = 0
        conditions.any[0].value = 'coffee**'
        const engine = setup()
        await engine.run()
        expect(eventSpy).to.have.been.calledWith(event)
      })
      it('fails and will not emit', async () => {
        const conditions = Object.assign({}, baseConditions)
        conditions.any[0].params.wordIndex = 0
        conditions.any[0].value = 'coffee'
        const engine = setup()
        await engine.run()
        expect(eventSpy).to.not.have.been.calledWith(event)
      })
    })

    describe('word length equals maxLength arg', () => {
      it('succeeds and emits', async () => {
        const conditions = Object.assign({}, baseConditions)
        conditions.any[0].params.wordIndex = 1
        conditions.any[0].value = 'aardvark'
        const engine = setup()
        await engine.run()
        expect(eventSpy).to.have.been.calledWith(event)
      })
      it('fails and will not emit', async () => {
        const conditions = Object.assign({}, baseConditions)
        conditions.any[0].params.wordIndex = 1
        conditions.any[0].value = 'Aardvark'
        const engine = setup()
        await engine.run()
        expect(eventSpy).to.not.have.been.calledWith(event)
      })
    })

    describe('word length is greater than the maxLength arg', () => {
      it('succeeds and emits', async () => {
        const conditions = Object.assign({}, baseConditions)
        conditions.any[0].params.wordIndex = 2
        conditions.any[0].value = 'impossible'
        const engine = setup()
        await engine.run()
        expect(eventSpy).to.have.been.calledWith(event)
      })
      it('fails and will not emit', async () => {
        const conditions = Object.assign({}, baseConditions)
        conditions.any[0].params.wordIndex = 2
        conditions.any[0].value = 'impossible*'
        const engine = setup()
        await engine.run()
        expect(eventSpy).to.not.have.been.calledWith(event)
      })
    })
  })
})
