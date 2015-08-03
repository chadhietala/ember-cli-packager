'use strict';
var funnel = require('broccoli-funnel');
var path = require('path');

module.exports = function (trees, engines, inclusions, exclusions) {
  var _trees = {};

  _trees.main = funnel(trees, {
    include: inclusions.main,
    exclude: exclusions.main
  });

  _trees.tests = funnel(trees, {
    include: inclusions.tests
  });

  _trees.shared = funnel(trees, {
    include: inclusions.shared
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
