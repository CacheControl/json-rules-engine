import { SuccessEventFact } from '../src/engine-facts'

describe('SuccessEventFact', () => {
  it('stores events', () => {
    let subject = SuccessEventFact()
    subject({ event: 1 })
    subject({ event: 2 })
    subject({ event: 3 })
    expect(subject()).to.include(1)
    expect(subject()).to.include(2)
    expect(subject()).to.include(3)
  })

  it('stores events independently of other instances', () => {
    let subject = SuccessEventFact()
    let subject2 = SuccessEventFact()
    subject({ event: 1 })
    subject2({ event: 2 })
    subject2({ event: 3 })
    expect(subject()).to.include(1)
    expect(subject().length).to.equal(1)
    expect(subject2()).to.include(2)
    expect(subject2()).to.include(3)
    expect(subject2().length).to.equal(2)
  })
})
