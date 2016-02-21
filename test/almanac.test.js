import { Fact } from '../src/index'
import Almanac from '../src/almanac'
import sinon from 'sinon'

describe('Almanac', () => {
  let almanac
  let factSpy = sinon.spy()

  describe('properties', () => {
    it('has methods for managing facts', () => {
      almanac = new Almanac()
      expect(almanac).to.have.property('factValue')
    })

    it('adds runtime facts', () => {
      almanac = new Almanac({}, { modelId: 'XYZ' })
      expect(almanac.runtimeFacts.get('modelId').value).to.equal('XYZ')
    })
  })

  describe('factValue', () => {
    describe('arguments', () => {
      beforeEach(() => {
        let fact = new Fact('foo', async (params, facts) => {
          if (params.userId) return params.userId
          return 'unknown'
        })
        let factMap = new Map()
        factMap.set(fact.id, fact)
        almanac = new Almanac(factMap)
      })

      it('allows parameters to be passed to the fact', async () => {
        return expect(almanac.factValue('foo')).to.eventually.equal('unknown')
      })

      it('allows parameters to be passed to the fact', async () => {
        return expect(almanac.factValue('foo', { userId: 1 })).to.eventually.equal(1)
      })

      it('throws an exception if it encounters an undefined fact', () => {
        expect(almanac.factValue('foo')).to.be.rejectedWith(/Undefined fact: foo/)
      })
    })

    describe('fact caching', () => {
      function setup (factOptions) {
        factSpy.reset()
        let fact = new Fact('foo', async (params, facts) => {
          factSpy()
          return 'unknown'
        }, factOptions)
        let factMap = new Map()
        factMap.set(fact.id, fact)
        almanac = new Almanac(factMap)
      }

      it('evaluates the fact every time when fact caching is off', () => {
        setup({ cache: false })
        almanac.factValue('foo')
        almanac.factValue('foo')
        almanac.factValue('foo')
        expect(factSpy).to.have.been.calledThrice
      })

      it('evaluates the fact once when fact caching is on', () => {
        setup({ cache: true })
        almanac.factValue('foo')
        almanac.factValue('foo')
        almanac.factValue('foo')
        expect(factSpy).to.have.been.calledOnce
      })
    })
  })
})
