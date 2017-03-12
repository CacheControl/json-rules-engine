'use strict'

import engineFactory from '../src/index'
import sinon from 'sinon'

describe('Engine: fact to fact comparison', () => {
  let engine
  let eventSpy = sinon.spy()

  function setup (conditions) {
    let event = { type: 'success-event' }
    eventSpy.reset()
    engine = engineFactory()
    let rule = factories.rule({ conditions, event })
    engine.addRule(rule)
    engine.on('success', eventSpy)
  }

  context('constant facts', () => {
    let constantCondition = {
      all: [{
        fact: 'height',
        operator: 'lessThanInclusive',
        value: {
          fact: 'width'
        }
      }]
    }
    it('allows a fact to retrieve other fact values', async () => {
      setup(constantCondition)
      await engine.run({ height: 1, width: 2 })
      expect(eventSpy).to.have.been.calledOnce()

      eventSpy.reset()

      await engine.run({ height: 2, width: 1 }) // negative case
      expect(eventSpy.callCount).to.equal(0)
    })
  })

  context('rules with parameterized conditions', () => {
    let paramsCondition = {
      all: [{
        fact: 'widthMultiplier',
        params: {
          multiplier: 2
        },
        operator: 'equal',
        value: {
          fact: 'heightMultiplier',
          params: {
            multiplier: 4
          }
        }
      }]
    }
    it('honors the params', async () => {
      setup(paramsCondition)
      engine.addFact('heightMultiplier', async (params, almanac) => {
        let height = await almanac.factValue('height')
        return params.multiplier * height
      })
      engine.addFact('widthMultiplier', async (params, almanac) => {
        let width = await almanac.factValue('width')
        return params.multiplier * width
      })
      await engine.run({ height: 5, width: 10 })
      expect(eventSpy).to.have.been.calledOnce()

      eventSpy.reset()

      await engine.run({ height: 5, width: 9 }) // negative case
      expect(eventSpy.callCount).to.equal(0)
    })
  })

  context('rules with parameterized conditions and path values', () => {
    let pathCondition = {
      all: [{
        fact: 'widthMultiplier',
        params: {
          multiplier: 2
        },
        path: '.feet',
        operator: 'equal',
        value: {
          fact: 'heightMultiplier',
          params: {
            multiplier: 4
          },
          path: '.meters'
        }
      }]
    }
    it('honors the path', async () => {
      setup(pathCondition)
      engine.addFact('heightMultiplier', async (params, almanac) => {
        let height = await almanac.factValue('height')
        return { meters: params.multiplier * height }
      })
      engine.addFact('widthMultiplier', async (params, almanac) => {
        let width = await almanac.factValue('width')
        return { feet: params.multiplier * width }
      })
      await engine.run({ height: 5, width: 10 })
      expect(eventSpy).to.have.been.calledOnce()

      eventSpy.reset()

      await engine.run({ height: 5, width: 9 }) // negative case
      expect(eventSpy.callCount).to.equal(0)
    })
  })
})
