'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RuleResult = function () {
  function RuleResult(conditions, event, priority, name) {
    _classCallCheck(this, RuleResult);

    this.conditions = (0, _clone2.default)(conditions);
    this.event = (0, _clone2.default)(event);
    this.priority = (0, _clone2.default)(priority);
    this.name = (0, _clone2.default)(name);
    this.result = null;
  }

  _createClass(RuleResult, [{
    key: 'setResult',
    value: function setResult(result) {
      this.result = result;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var stringify = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      var props = {
        conditions: this.conditions.toJSON(false),
        event: this.event,
        priority: this.priority,
        name: this.name,
        result: this.result
      };
      if (stringify) {
        return JSON.stringify(props);
      }
      return props;
    }
  }]);

  return RuleResult;
}();

exports.default = RuleResult;