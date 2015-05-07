'use strict';

var mergeTrees = require('broccoli-merge-trees');
var concat = require('broccoli-sourcemap-concat');

function diff(arr1, arr2) {
  return arr1.filter(function(item) {
    return arr2.indexOf(item) < 0;
  });
}

function createGlobs(dirs) {
  return dirs.map(function(dir) {
    return dir + '/**/*.js';
  });
}

module.exports = function(tree, graph, entries) {
  var vendorGlobs = createGlobs(diff(Object.keys(graph), entries));
  var entryGlobs = createGlobs(entries);

  return mergeTrees([
    concat(tree, { inputFiles: vendorGlobs, outputFile: 'vendor.js' })
  ].concat(entryGlobs.map(function(glob, i) {
    return concat(tree, { inputFiles: glob, outputFile: entries[i] + '.js' });
  })));
};
