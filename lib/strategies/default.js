'use strict';

var mergeTrees = require('broccoli-merge-trees');
var concat = require('broccoli-sourcemap-concat');
var funnel = require('broccoli-funnel');

function createGlobs(dirs, ext) {
  return dirs.map(function(dir) {
    return dir + '/**/*.' + ext;
  });
}

function flatten(arr) {
  return [].concat.apply([], arr);
}


function createGlobs(entry, exts) {
  return exts.map(function(ext) {
    return entry + '/**/*.' + ext;
  });
}

function concatEntries(tree, entries, exts, globs, outputPaths) {
  return flatten(entries.map(function(entry) {
    return globs[entry].map(function(glob, i) {
      var ext = exts[i];
      var outputPath = outputPaths['app'][ext];

      if (ext === 'css') {
        outputPath = outputPath['app'];
      }

      return concat(tree, {
        outputFile: outputPath,
        inputFiles: [glob]
      });
    });
  }));
}

function concatVendor(tree, entries, exts, outputPaths) {
  var exclusionGlobs = entries.map(function(entry) {
    return entry + '/*';
  });

  var vendorTrees = funnel(tree, {
    exclude: exclusionGlobs
  });

  return exts.map(function(ext) {
    var glob = ['**/*.' + ext];
    return concat(vendorTrees, {
      outputFile: outputPaths['vendor'][ext],
      inputFiles: glob
    });
  });
}

module.exports = function(tree, entries, outputPaths) {
  var exts = ['js', 'css', 'html'];
  var globs = {};

  entries.forEach(function(entry) {
    globs[entry] = createGlobs(entry, exts);
  });

  var entryTrees = concatEntries(tree, entries, exts, globs, outputPaths);
  var vendorTrees = concatVendor(tree, entries, ['js', 'css'], outputPaths);

  return mergeTrees(entryTrees.concat(vendorTrees));
};
