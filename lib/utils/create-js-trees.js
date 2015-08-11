'use strict';
var funnel = require('broccoli-funnel');
var path = require('path');

module.exports = function (trees, engines, inclusions, exclusions, concatOptions) {
  var _trees = {};
  var _inclusions = {};

  // We need to include the files that are going to be prepended and appended
  // howver we want to hold the globs seperate.  This creates an object by type
  // with the globs concated
  Object.keys(concatOptions).forEach(function(type) {
    _inclusions[type] = [];
    _inclusions[type] = _inclusions[type].concat(concatOptions[type].prepend, concatOptions[type].append);
  });

  _trees.main = funnel(trees, {
    include: inclusions.main.concat(_inclusions.main),
    exclude: exclusions.main
  });

  _trees.tests = funnel(trees, {
    include: inclusions.tests.concat(_inclusions.tests)
  });

  _trees.shared = funnel(trees, {
    include: inclusions.shared.concat(_inclusions.shared)
  });

  if (engines.length > 0) {
    engines.forEach(function(engine) {
      _trees[engine.name] = funnel(trees, {
        include: ['engines' + path.sep + engine.name + path.sep + '**/*.js']
      });
    });
  }

  return _trees;
};
