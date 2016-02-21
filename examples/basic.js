'use strict'

var Engine = require('../dist').Engine
var engine = new Engine()

var incomeRule = {
  conditions: {
    all: [{
      fact: 'income',
      operator: 'greaterThanInclusive',
      value: 20000
    }]
  },
  event: {
    type: 'income'
  }
}
engine.addRule(incomeRule)

var educationRule = {
  conditions: {
    all: [{
      fact: 'education',
      operator: 'equals',
      value: 'high-school'
    }]
  },
  event: {
    type: 'education'
  }
}
engine.addRule(educationRule)

var data = [{
  income: 30000,
  education: 'college',
  username: 'user1'
}
// {
//   income: 15000,
//   education: 'high-school',
//   username: 'user2'
// }
]
data.forEach(function (input) {
  engine.run(input)
})
engine.on('success', function (event, engine) {
  engine.factValue('username').then(function (username) {
    console.log(username + ' met conditions for the ' + event.type + ' rule')
  })
})
