'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var SuccessEventFact = function SuccessEventFact() {
  var successTriggers = [];
  return function () {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (params.event) {
      successTriggers.push(params.event);
    }
    return successTriggers;
  };
};

exports.SuccessEventFact = SuccessEventFact;