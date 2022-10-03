'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = debug;
function debug(message) {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.DEBUG && process.env.DEBUG.match(/json-rules-engine/) || typeof window !== 'undefined' && window.localStorage && window.localStorage.debug && window.localStorage.debug.match(/json-rules-engine/)) {
      console.log(message);
    }
  } catch (ex) {
    // Do nothing
  }
}