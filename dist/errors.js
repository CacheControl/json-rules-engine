'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UndefinedFactError = exports.UndefinedFactError = function (_Error) {
  _inherits(UndefinedFactError, _Error);

  function UndefinedFactError() {
    var _ref;

    _classCallCheck(this, UndefinedFactError);

    for (var _len = arguments.length, props = Array(_len), _key = 0; _key < _len; _key++) {
      props[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, (_ref = UndefinedFactError.__proto__ || Object.getPrototypeOf(UndefinedFactError)).call.apply(_ref, [this].concat(props)));

    _this.code = 'UNDEFINED_FACT';
    return _this;
  }

  return UndefinedFactError;
}(Error);