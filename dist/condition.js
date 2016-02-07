'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _params = require('params');

var _params2 = _interopRequireDefault(_params);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Condition = function () {
  function Condition(properties) {
    _classCallCheck(this, Condition);

    var booleanOperator = undefined;
    if (properties.hasOwnProperty('any')) {
      booleanOperator = 'any';
    } else if (properties.hasOwnProperty('all')) {
      booleanOperator = 'all';
    }
    Object.assign(this, properties);
    if (booleanOperator) {
      var subConditions = properties[booleanOperator];
      if (!(subConditions instanceof Array)) {
        throw new Error('"' + booleanOperator + '" must be an array');
      }
      this.operator = booleanOperator;
      // boolean conditions always have a priority; default 1
      this.priority = parseInt(properties.priority, 10) || 1;
      this[booleanOperator] = subConditions.map(function (c) {
        return new Condition(c);
      });
    } else {
      properties = (0, _params2.default)(properties).require(['fact', 'operator', 'value']);
      // a non-boolean condition does not have a priority by default. this allows
      // priority to be dictated by the fact definition
      if (properties.hasOwnProperty('priority')) {
        properties.priority = parseInt(properties.priority, 10);
      }
    }
  }

  _createClass(Condition, [{
    key: 'evaluate',
    value: function evaluate(comparisonValue) {
      switch (this.operator) {
        case 'equal':
          return comparisonValue === this.value;
        case 'notEqual':
          return comparisonValue !== this.value;
        case 'in':
          return this.value.includes(comparisonValue);
        case 'notIn':
          return !this.value.includes(comparisonValue);
        case 'lessThan':
          return comparisonValue < this.value;
        case 'lessThanInclusive':
          return comparisonValue <= this.value;
        case 'greaterThan':
          return comparisonValue > this.value;
        case 'greaterThanInclusive':
          return comparisonValue >= this.value;
        // for any/all, simply comparisonValue that the sub-condition array evaluated truthy
        case 'any':
          return comparisonValue === true;
        case 'all':
          return comparisonValue === true;
        default:
          throw new Error('Unknown operator: ' + this.operator);
      }
    }
  }, {
    key: 'isBooleanOperator',
    value: function isBooleanOperator() {
      return this.any !== undefined || this.all !== undefined;
    }
  }]);

  return Condition;
}();

exports.default = Condition;