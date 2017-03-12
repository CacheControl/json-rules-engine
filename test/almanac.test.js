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
      almanac = new Almanac(new Map(), { modelId: 'XYZ' })
      expect(almanac.factMap.get('modelId').value).to.equal('XYZ')
    })
  })

  describe('constructor', () => {
    it('supports runtime facts as key => values', () => {
      almanac = new Almanac(new Map(), { fact1: 3 })
      return expect(almanac.factValue('fact1')).to.eventually.equal(3)
    })

    it('supports runtime fact instances', () => {
      let fact = new Fact('fact1', 3)
      almanac = new Almanac(new Map(), { fact1: fact })
      return expect(almanac.factValue('fact1')).to.eventually.equal(fact.value)
    })
  })

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

  describe('addRuntimeFact', () => {
    it('adds a key/value pair to the factMap as a fact instance', () => {
      almanac = new Almanac()
      almanac.addRuntimeFact('factId', 'factValue')
      expect(almanac.factMap.get('factId').value).to.equal('factValue')
    })
  })

  describe('_addConstantFact', () => {
    it('adds fact instances to the factMap', () => {
      let fact = new Fact('factId', 'factValue')
      almanac = new Almanac()
      almanac._addConstantFact(fact)
      expect(almanac.factMap.get(fact.id).value).to.equal(fact.value)
    })
  })

  describe('_getFact', _ => {
    it('retrieves the fact object', () => {
      let facts = new Map()
      let fact = new Fact('id', 1)
      facts.set(fact.id, fact)
      almanac = new Almanac(facts)
      expect(almanac._getFact('id')).to.equal(fact)
    })

    it('raises an exception if fact DNE', () => {
      almanac = new Almanac(new Map())
      expect(almanac._getFact.bind(almanac, 'unknown')).to.throw(/Undefined fact/)
    })
  })

  describe('_setFactValue()', () => {
    function expectFactResultsCache (expected) {
      let promise = almanac.factResultsCache.values().next().value
      expect(promise).to.be.instanceof(Promise)
      promise.then(value => expect(value).to.equal(expected))
      return promise
    }

    function setup (f = new Fact('id', 1)) {
      fact = f
      let facts = new Map()
      facts.set(fact.id, fact)
      almanac = new Almanac(facts)
    }
    let fact
    const FACT_VALUE = 2

    it('updates the fact results and returns a promise', (done) => {
      setup()
      almanac._setFactValue(fact, {}, FACT_VALUE)
      expectFactResultsCache(FACT_VALUE).then(_ => done()).catch(done)
    })

    it('honors facts with caching disabled', (done) => {
      setup(new Fact('id', 1, { cache: false }))
      let promise = almanac._setFactValue(fact, {}, FACT_VALUE)
      expect(almanac.factResultsCache.values().next().value).to.be.undefined()
      promise.then(value => expect(value).to.equal(FACT_VALUE)).then(_ => done()).catch(done)
    })
  })

  describe('factValue()', () => {
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
      expect(factSpy).to.have.been.calledThrice()
    })

    it('evaluates the fact once when fact caching is on', () => {
      setup({ cache: true })
      almanac.factValue('foo')
      almanac.factValue('foo')
      almanac.factValue('foo')
      expect(factSpy).to.have.been.calledOnce()
    })
  })
})
