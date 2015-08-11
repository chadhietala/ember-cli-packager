'use strict';
var path = require('path');

function createJsInclusions(types) {
  var main = types.filter(function(type) { return type.type === 'main'; })[0].name;
  var tests = types.filter(function(type) { return type.type === 'tests'; })[0].name;

  var appInclusions = ['engines' + path.sep + main + path.sep + '**/*.js'];

  var testInclusions = ['engines' + path.sep + tests + path.sep + '**/*.js'];

  var sharedInclusions = [
    'engines' + path.sep + 'shared' + path.sep + '**/*.js',
    'engines' + path.sep + 'shared' + path.sep + '*.js'
  ];

  return {
    main: appInclusions,
    tests: testInclusions,
    shared: sharedInclusions
  };
}

module.exports = createJsInclusions;
