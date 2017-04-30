'use strict'

let http = require('http')
let url = require('url')
let fs = require('fs')
let path = require('path')
let port = process.env.HTTP_PORT || 3000
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css'
}

exports.port = port

exports.start = () => {
  return http.createServer((req, res) => {
    let parsedUrl = url.parse(req.url)
    let pathname = path.join(__dirname, `${parsedUrl.pathname}`)
    console.log(`${req.method}::${req.url}::${pathname}`)
    fs.readFile(pathname, (err, data) => {
      if (err) {
        res.statusCode = 500
        res.end(`Error getting the file: ${err}.`)
      } else {
        // based on the URL path, extract the file extention. e.g. .js, .doc, ...
        const ext = path.parse(pathname).ext
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', mimeTypes[ext] || 'text/plain')
        res.end(data)
      }
    })
  })
}
