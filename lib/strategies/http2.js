'use strict';

var globsFor = require('../utils/globs-for');
var concat = require('broccoli-sourcemap-concat');
var mergeTrees = require('broccoli-merge-trees');
var stew = require('broccoli-stew');
var funnel = require('broccoli-funnel');
var rename = stew.rename;
var env = stew.env;

function concatAppInitialization(tree, main) {
  var outputPath = main + '/index.js';
  var globs = [outputPath];

  globsFor('main', globs);

  return concat(tree, {
    outputFile: outputPath,
    inputFiles: globs
  });
}

function concatTestInitialization(tree, main) {
  var outputPath = main + '-tests/index.js';
  var globs = [outputPath];

  tree = rename(tree, function(relativePath) {
    if (relativePath === main + '/test-index.js') {
      return main + '-tests/index.js';
    }
    return relativePath;
  });

  globsFor('test', globs);

  return concat(tree, {
    outputFile: outputPath,
    inputFiles: globs
  });
}

module.exports = function(tree, main, entries, outputPaths) {
  var trees = [tree];
  var exclusions = ['__packager__/*', main + '/test-index.js', '**/dep-graph.json'];
  trees.push(concatAppInitialization(tree, main, outputPaths.app.js));

  env('!production', function() {
    trees.push(concatTestInitialization(tree, main, outputPaths.app.js));
  });

  env('production', function() {
    exclusions.push(main + '-tests/**/*');
  });

  return funnel(mergeTrees(trees, { overwrite: true }), {
    exclude: exclusions
  });
};