'use strict';

var globsFor = require('../utils/globs-for');
var concat = require('broccoli-sourcemap-concat');
var mergeTrees = require('broccoli-merge-trees');
var stew = require('broccoli-stew');
var funnel = require('broccoli-funnel');
var rename = stew.rename;
var rm = stew.rm;

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

  tree = rm(tree, main + '/test-index.js');

  globsFor('test', globs);

  return concat(tree, {
    outputFile: outputPath,
    inputFiles: globs
  });
}

module.exports = function(tree, main, entries, outputPaths) {
  var mainApp = concatAppInitialization(tree, main, outputPaths.app.js);
  var test = concatTestInitialization(tree, main, outputPaths.app.js);

  return funnel(mergeTrees([test, tree, mainApp], { overwrite: true }), {
    exclude: ['__packager__/*', main + '/test-index.js', '**/dep-graph.json']
  });
};