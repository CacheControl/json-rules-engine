'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Operator = function () {
  /**
   * Constructor
   * @param {string}   name - operator identifier
   * @param {function(factValue, jsonValue)} callback - operator evaluation method
   * @param {function}  [factValueValidator] - optional validator for asserting the data type of the fact
   * @returns {Operator} - instance
   */
  function Operator(name, cb, factValueValidator) {
    _classCallCheck(this, Operator);

    this.name = String(name);
    if (!name) throw new Error('Missing operator name');
    if (typeof cb !== 'function') throw new Error('Missing operator callback');
    this.cb = cb;
    this.factValueValidator = factValueValidator;
    if (!this.factValueValidator) this.factValueValidator = function () {
      return true;
    };
  }

  /**
   * Takes the fact result and compares it to the condition 'value', using the callback
   * @param   {mixed} factValue - fact result
   * @param   {mixed} jsonValue - "value" property of the condition
   * @returns {Boolean} - whether the values pass the operator test
   */


  _createClass(Operator, [{
    key: 'evaluate',
    value: function evaluate(factValue, jsonValue) {
      return this.factValueValidator(factValue) && this.cb(factValue, jsonValue);
    }
  }]);

  return Operator;
}();

exports.default = Operator;