'use strict'

require('colors')

var accountData = {
  washington: {
     company: 'microsoft',
     status: 'terminated',
     createdAt: '2012-02-14'
  },
  jefferson: {
    company: 'apple',
    status: 'terminated',
    createdAt: '2005-04-03'
  }
}

/**
 * mock api client for retrieving account information
 */
module.exports = {
  getAccountInformation: function (accountId) {
    var message = 'loading account information for "' + accountId + '"'
    console.log(message.dim)
    return new Promise(function (resolve, reject) {
      setImmediate(function () {
        resolve({ status: 'success', data: accountData[accountId]})
      })
    })
  }
}
