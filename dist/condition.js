'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var params = require('params');
var debug = require('debug')('json-rules-engine');
var isPlainObject = require('lodash.isplainobject');

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
      properties = params(properties).require(['fact', 'operator', 'value']);
      // a non-boolean condition does not have a priority by default. this allows
      // priority to be dictated by the fact definition
      if (properties.hasOwnProperty('priority')) {
        properties.priority = parseInt(properties.priority, 10);
      }
    }
  }

  /**
   * Converts the condition into a json-friendly structure
   * @param   {Boolean} stringify - whether to return as a json string
   * @returns {string,object} json string or json-friendly object
   */


  _createClass(Condition, [{
    key: 'toJSON',
    value: function toJSON() {
      var stringify = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

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
        if (this.path) {
          props.path = this.path;
        }
      }
      if (stringify) {
        return JSON.stringify(props);
      }
      return props;
    }

    /**
     * Interprets .value as either a primitive, or if a fact, retrieves the fact value
     */

  }, {
    key: '_getValue',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(almanac) {
        var value;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                value = this.value;

                if (!(isPlainObject(value) && value.hasOwnProperty('fact'))) {
                  _context.next = 5;
                  break;
                }

                _context.next = 4;
                return almanac.factValue(value.fact, value.params, value.path);

              case 4:
                value = _context.sent;

              case 5:
                return _context.abrupt('return', value);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _getValue(_x2) {
        return _ref.apply(this, arguments);
      }

      return _getValue;
    }()

    /**
     * Takes the fact result and compares it to the condition 'value', using the operator
     *   LHS                      OPER       RHS
     * <fact + params + path>  <operator>  <value>
     *
     * @param   {Almanac} almanac
     * @param   {Map} operatorMap - map of available operators, keyed by operator name
     * @returns {Boolean} - evaluation result
     */

  }, {
    key: 'evaluate',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(almanac, operatorMap) {
        var op, rightHandSideValue, leftHandSideValue, evaluationResult;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (almanac) {
                  _context2.next = 2;
                  break;
                }

                throw new Error('almanac required');

              case 2:
                if (operatorMap) {
                  _context2.next = 4;
                  break;
                }

                throw new Error('operatorMap required');

              case 4:
                if (!this.isBooleanOperator()) {
                  _context2.next = 6;
                  break;
                }

                throw new Error('Cannot evaluate() a boolean condition');

              case 6:
                op = operatorMap.get(this.operator);

                if (op) {
                  _context2.next = 9;
                  break;
                }

                throw new Error('Unknown operator: ' + this.operator);

              case 9:
                _context2.next = 11;
                return this._getValue(almanac);

              case 11:
                rightHandSideValue = _context2.sent;
                _context2.next = 14;
                return almanac.factValue(this.fact, this.params, this.path);

              case 14:
                leftHandSideValue = _context2.sent;
                evaluationResult = op.evaluate(leftHandSideValue, rightHandSideValue);

                debug('condition::evaluate <' + leftHandSideValue + ' ' + this.operator + ' ' + rightHandSideValue + '?> (' + evaluationResult + ')');
                return _context2.abrupt('return', evaluationResult);

              case 18:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function evaluate(_x3, _x4) {
        return _ref2.apply(this, arguments);
      }

      return evaluate;
    }()

    /**
     * Returns the boolean operator for the condition
     * If the condition is not a boolean condition, the result will be 'undefined'
     * @return {string 'all' or 'any'}
     */

  }, {
    key: 'booleanOperator',


    /**
     * Returns the condition's boolean operator
     * Instance version of Condition.isBooleanOperator
     * @returns {string,undefined} - 'any', 'all', or undefined (if not a boolean condition)
     */
    value: function booleanOperator() {
      return Condition.booleanOperator(this);
    }

    /**
     * Whether the operator is boolean ('all', 'any')
     * @returns {Boolean}
     */

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