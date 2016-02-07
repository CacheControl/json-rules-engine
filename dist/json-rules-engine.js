'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Rule = exports.Fact = undefined;

exports.default = function (set) {
  return new _engine2.default(set);
};

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var _fact = require('./fact');

var _fact2 = _interopRequireDefault(_fact);

var _rule = require('./rule');

var _rule2 = _interopRequireDefault(_rule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Fact = _fact2.default;
exports.Rule = _rule2.default;