'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _params = require('params');

var _params2 = _interopRequireDefault(_params);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Condition = function () {
  function Condition(properties) {
    _classCallCheck(this, Condition);

    var booleanOperator = Condition.booleanOperator(properties);
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
    key: 'toJSON',
    value: function toJSON() {
      var stringify = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var props = {};
      if (this.priority) {
        props.priority = this.priority;
      }
      var oper = Condition.booleanOperator(this);
      if (oper) {
        props[oper] = this[oper].map(function (c) {
          return c.toJSON(stringify);
        });
      } else {
        props.operator = this.operator;
        props.value = this.value;
        props.fact = this.fact;
        if (this.params) {
          props.params = this.params;
        }
      }
      if (stringify) {
        return JSON.stringify(props);
      }
      return props;
    }
  }, {
    key: 'validateComparisonValue',
    value: function validateComparisonValue(comparisonValue) {
      switch (this.operator) {
        case 'contains':
        case 'doesNotContain':
          return Array.isArray(comparisonValue);
        case 'lessThan':
        case 'lessThanInclusive':
        case 'greaterThan':
        case 'greaterThanInclusive':
          return Number.parseFloat(comparisonValue).toString() !== 'NaN';
        default:
          return true;
      }
    }
  }, {
    key: 'evaluate',
    value: function evaluate(comparisonValue) {
      if (!this.validateComparisonValue(comparisonValue)) {
        return false;
      }
      switch (this.operator) {
        case 'equal':
          return comparisonValue === this.value;
        case 'notEqual':
          return comparisonValue !== this.value;
        case 'in':
          return this.value.includes(comparisonValue);
        case 'notIn':
          return !this.value.includes(comparisonValue);
        case 'contains':
          return comparisonValue.includes(this.value);
        case 'doesNotContain':
          return !comparisonValue.includes(this.value);
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

    /**
     * Returns the boolean operator for the condition
     * If the condition is not a boolean condition, the result will be 'undefined'
     * @return {string 'all' or 'any'}
     */

  }, {
    key: 'booleanOperator',
    value: function booleanOperator() {
      return Condition.booleanOperator(this);
    }
  }, {
    key: 'isBooleanOperator',
    value: function isBooleanOperator() {
      return Condition.booleanOperator(this) !== undefined;
    }
  }], [{
    key: 'booleanOperator',
    value: function booleanOperator(condition) {
      if (condition.hasOwnProperty('any')) {
        return 'any';
      } else if (condition.hasOwnProperty('all')) {
        return 'all';
      }
    }
  }]);

  return Condition;
}();

exports.default = Condition;