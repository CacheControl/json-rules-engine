module.exports = function (name) {
  try {
    return require('debug')(name)
  } catch (e) {
    return function () {}
  }
}
