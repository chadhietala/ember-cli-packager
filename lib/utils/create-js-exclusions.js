'use strict';

var path = require('path');

module.exports = function(rules) {
  var exclusions = {};

  rules.forEach(function(rule) {
    exclusions[rule.name] = ['engines' + path.sep + rule.exclusion + path.sep + '**/*.js'];
  });

  return exclusions;
};
