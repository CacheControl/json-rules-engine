'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Engine = exports.Operator = exports.Rule = exports.Fact = undefined;

exports.default = function (rules, options) {
  return new _engine2.default(rules, options);
};

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

var _fact = require('./fact');

var _fact2 = _interopRequireDefault(_fact);

var _rule = require('./rule');

var _rule2 = _interopRequireDefault(_rule);

var _operator = require('./operator');

var _operator2 = _interopRequireDefault(_operator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Fact = _fact2.default;
exports.Rule = _rule2.default;
exports.Operator = _operator2.default;
exports.Engine = _engine2.default;