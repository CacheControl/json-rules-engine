'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _objectHash = require('object-hash');

var _objectHash2 = _interopRequireDefault(_objectHash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = require('debug')('json-rules-engine');

var Fact = function () {
  function Fact(id, options, valueOrMethod) {
    _classCallCheck(this, Fact);

    this.id = id;
    var defaultOptions = { cache: true };
    if (typeof options === 'function') {
      valueOrMethod = options;
      options = defaultOptions;
    } else if (typeof options === 'undefined') {
      options = defaultOptions;
    }
    if (typeof valueOrMethod !== 'function') {
      this.value = valueOrMethod;
    } else {
      this.calculationMethod = valueOrMethod;
    }
    this.priority = parseInt(options.priority || 1, 10);
    this.options = options;
    this.cacheKeyMethod = this.defaultCacheKeys;
    return this;
  }

  _createClass(Fact, [{
    key: 'calculate',
    value: function calculate(params, engine) {
      // if constant fact w/set value, return immediately
      if (this.hasOwnProperty('value')) {
        return this.value;
      }
      return this.calculationMethod(params, engine);
    }
  }, {
    key: 'defaultCacheKeys',
    value: function defaultCacheKeys(id, params) {
      return { params: params, id: id };
    }
  }, {
    key: 'getCacheKey',
    value: function getCacheKey(params) {
      if (this.options.cache === true) {
        var cacheProperties = this.cacheKeyMethod(this.id, params);
        return Fact.hashFromObject(cacheProperties);
      }
    }
  }], [{
    key: 'hashFromObject',
    value: function hashFromObject(obj) {
      debug('fact::hashFromObject generating cache key from:', obj);
      return (0, _objectHash2.default)(obj);
    }
  }]);

  return Fact;
}();

exports.default = Fact;