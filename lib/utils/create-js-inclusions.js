'use strict';
var path = require('path');

function createJsInclusions(types, concatOptions) {
  var main = types.filter(function(type) { return type.type === 'main'; })[0].name;
  var tests = types.filter(function(type) { return type.type === 'tests'; })[0].name;

  var appInclusions = ['engines' + path.sep + main + path.sep + '**/*.js'].concat(
    concatOptions.main.append,
    concatOptions.main.prepend
  );

  var testInclusions = ['engines' + path.sep + tests + path.sep + '**/*.js'].concat(
    concatOptions.tests.append,
    concatOptions.tests.prepend
  );

  var sharedInclusions = [
    'engines' + path.sep + 'shared' + path.sep + '**/*.js',
    'legacy/**/*.js'
  ].concat(
    concatOptions.shared.append,
    concatOptions.shared.prepend
  );

  return {
    main: appInclusions,
    tests: testInclusions,
    shared: sharedInclusions
  };
}

module.exports = createJsInclusions;
