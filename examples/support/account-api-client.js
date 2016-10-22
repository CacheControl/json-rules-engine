'use strict'

require('colors')

let accountData = {
  washington: {
    company: 'microsoft',
    status: 'terminated',
    ptoDaysTaken: ['2016-12-25', '2016-04-01'],
    createdAt: '2012-02-14'
  },
  jefferson: {
    company: 'apple',
    status: 'terminated',
    ptoDaysTaken: ['2015-01-25'],
    createdAt: '2005-04-03'
  },
  lincoln: {
    company: 'microsoft',
    status: 'active',
    ptoDaysTaken: ['2016-02-21', '2016-12-25', '2016-03-28'],
    createdAt: '2015-06-26'
  }
}

/**
 * mock api client for retrieving account information
 */
module.exports = {
  getAccountInformation: (accountId) => {
    var message = 'loading account information for "' + accountId + '"'
    console.log(message.dim)
    return new Promise((resolve, reject) => {
      setImmediate(() => {
        resolve(accountData[accountId])
      })
    })
  }
}
