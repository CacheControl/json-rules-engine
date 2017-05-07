'use strict'

let webdriver = require('selenium-webdriver')
let webserver = require('./webserver')
let username = process.env.SAUCE_USERNAME
let accessKey = process.env.SAUCE_ACCESS_KEY
let driver

if (!username) throw new Error('Saucelabs username required')
if (!accessKey) throw new Error('Saucelabs access key required')

driver = new webdriver.Builder()
  .withCapabilities({
    'browserName': 'chrome',
    'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
    'version': 'latest',
    'username': username,
    'accessKey': accessKey
  })
  .usingServer(`http://${username}:${accessKey}@ondemand.saucelabs.com:80/wd/hub`)
  .build()

let server = webserver.start()
server.listen(parseInt(webserver.port), () => {
  console.info(`web server listening on ${webserver.port}`)
  driver.get(`http://localhost:${webserver.port}/index.html`)

  driver.getTitle().then(function (title) {
    console.log('title is: ' + title)
  })

  Promise.all([
    driver.findElement(webdriver.By.css('.passes > em')).getText(),
    driver.findElement(webdriver.By.css('.failures > em')).getText()
  ]).then(texts => {
    let passCount = texts[0]
    let failCount = texts[1]
    console.log(`${passCount} tests passed; ${failCount} tests failed.`)
    driver.quit()
    server.close()
    if (Number(passCount) > 0 && Number(failCount) === 0) {
      return process.exit(0)
    }
    process.exit(1)
  })
})
