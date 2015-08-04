'use strict';
var createJsTrees = require('../utils/create-js-trees');
var createJsInclusions = require('../utils/create-js-inclusions');
var createJsExclusions = require('../utils/create-js-exclusions');
var mergeTrees = require('broccoli-merge-trees');
var concat = require('broccoli-sourcemap-concat');
var filterLegacyFiles = require('../utils/filter-legacy');

function concatJs(options) {
  var jsTrees = options.trees;
  var types = options.types;
  var concatOptions = options.concatOptions;
  var sourcemaps = options.sourcemaps;
  var inclusions = createJsInclusions(types, concatOptions);
  var exclusions = createJsExclusions([
    {
      name: 'main', exclusion: types.filter(function(type) {
        return type.type === 'tests';
      })[0].name
    }
  ]);
  var engines = types.filter(function(type) {
    return type.type === 'engine';
  });
  var trees = createJsTrees(jsTrees, engines, inclusions, exclusions);

  return Object.keys(trees).map(function(type) {
    var output = types.filter(function(typeObj) {
      return typeObj.type === type;
    })[0].output.js;

    return new concat(trees[type], {
      headerFiles: concatOptions[type].prepend,
      footerFiles: concatOptions[type].append,
      inputFiles: inclusions[type],
      outputFile: output,
      sourcemaps: sourcemaps
    });
  });
}

module.exports = function(assembler, options) {
  var trees = options.trees;
  var types = options.types;
  var concatOptions = options.concatOptions;
  var sourcemaps = options.sourcemaps;
  var legacyCSS = options.trees.legacy.css;
  var legacyTestSupport = options.trees.legacy.test;
  var otherAssets = options.trees.others;

  var javascriptTree = concatJs({
    trees: trees.js,
    types: types,
    concatOptions: concatOptions,
    sourcemaps: sourcemaps
  });

  javascriptTree = assembler.addonPostprocessTree('js', javascriptTree);

  return mergeTrees(javascriptTree.concat(
    trees.public,
    trees.html,
    trees.testem,
    // otherAssets,
    // legacyCSS,
    // legacyTestSupport,
    mergeTrees(trees.styles)
  ));
};
