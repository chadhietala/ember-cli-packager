'use strict';
var funnel = require('broccoli-funnel');
var Assembler = require('ember-cli-assembler');
var Linker = require('ember-cli-linker');
var mergeTrees = require('broccoli-merge-trees');
var defaults = require('merge-defaults');
var flatten = require('lodash-node/modern/array/flatten');
var uniq = require('lodash-node/modern/array/uniq');
var defaultStrategy = require('./strategies/default');
var path = require('path');
var stew = require('broccoli-stew');
var rename = stew.rename;

/**
  Available init options:
    - es3Safe, defaults to `true`,
    - storeConfigInMeta, defaults to `true`,
    - autoRun, defaults to `true`,
    - outputPaths, defaults to `{}`,
    - minifyCSS, defaults to `{enabled: !!isProduction,options: { relativeTo: 'app/styles' }},
    - minifyJS, defaults to `{enabled: !!isProduction},
    - loader, defaults to this.bowerDirectory + '/loader.js/loader.js',
    - sourcemaps, defaults to `{}`,
    - trees, defaults to `{},`
    - jshintrc, defaults to `{},`
    - vendorFiles, defaults to `{}`
 */
function Packager(options) {
  options = options || {};
  this.strategies = options.strategies || ['default'];
  this.composeCustomOutput = options.composeCustomOutput || null;
  this.assembler = new Assembler(options);
  this.main = this.assembler.name;
  this.tests = this.assembler.testPath;
  this.entries = options.entries || [this.assembler.name, this.assembler.testPath];
  this.entries = this.concatEntries(this.entries);
  options.entries = this.entries;
  this.shared = 'shared';
  this.outputPaths = this.assembler.options.outputPaths;
  this.whitelist = options.whitelist || [];
  this.trees = {};
  var concatOptions = options.concatOptions || {};
  this.concatOptions = this._mergeConcatOptions(concatOptions);
  this.sourcemaps = options.sourcemaps;
}

// In the future this may need to account for N engines,
// however I'm not convinced that engines should need to wrap themselves
// in preamble files.
Packager.prototype._mergeConcatOptions = function(concatOptions) {
  var sharedOptions = {
    prepend: ['__packager__/loader.js', '__packager__/vendor-prefix.js'],
    append: ['__packager__/vendor-suffix.js']
  };

  var mainOptions = {
    prepend: ['__packager__/app-prefix.js'],
    append: ['__packager__/app-suffix.js', '__packager__/app-boot.js']
  };

  var testOptions = {
    prepend: ['__packager__/test-support-prefix.js'],
    append: ['__packager__/test-support-suffix.js']
  };

  var defaultConcat = {
    tests: testOptions,
    main: mainOptions,
    shared: sharedOptions
  };

  return defaults(concatOptions, defaultConcat);
};

/**
 * Ensures that nodes and descriptors are in the same order.
 * @return {object} The nodes and descs used for the linker
 */
Packager.prototype.alignNodesAndDescriptors = function() {
  var nodes = [];
  var descs = [];
  var entryNodes = this._collectEntryNodes();
  var entryDescs = this._collectEntryDesriptors();
  var addonNodes = this.assembled.treesByType('addon');
  var addonDescs = this.assembled.descriptorsByType('addon');
  var testNodes = this.assembled.treesByType('tests');
  var testDescs = this.assembled.descriptorsByType('tests');
  var distNodes = this.assembled.treesByType('dist');
  var distDescs = this.assembled.descriptorsByType('dist');

  // Note: the order matters here. With in the Linker we use position in the
  // inputNodes array to peak into the ordered descriptors array to access meta
  // data about the node instead of tacking it on the node object it self.
  nodes = nodes.concat(
    entryNodes,
    addonNodes,
    testNodes,
    distNodes
  );

  descs = descs.concat(
    entryDescs,
    addonDescs,
    testDescs,
    distDescs
  );

  if (descs.length > nodes.length) {
    var seenPackages = [];
    descs = descs.reduce(function(accumulator, desc) {
      if (seenPackages.indexOf(desc.name) < 0) {
        accumulator.push(desc);
        seenPackages.push(desc.name);
      }
      return accumulator;
    }, []);
  }

  return {
    nodes: nodes,
    descs: descs
  };
};

Packager.prototype._collectEntryNodes = function() {
  return this.entries.map(function(entry) {
    var desc = this.assembled.get(entry);
    var appTree = desc.trees.app;
    var alias = desc.aliases ? desc.aliases[entry] : null;
    if (appTree) {
      return appTree;
    } else if (alias) {
      return desc.trees[alias.treeType];
    }

    throw new Error('No tree found for ' + entry);

  }, this);
};

Packager.prototype._collectEntryDesriptors = function() {
  return this.entries.map(function(entry) {
    return this.assembled.get(entry);
  }, this);
};

Packager.prototype._buildWhiteList = function(/*...whitelist*/) {
  var whitelist = ['loader.js', 'ember-cli-shims'];

  for (var i = 0, l = arguments.length; i < l; i++) {
    whitelist = whitelist.concat(arguments[i]);
  }

  return uniq(whitelist);
};

Packager.prototype.import = function() {
  this.assembler.import.apply(this.assembler, arguments);
};

Packager.prototype.concatEntries = function(entries) {
  if (Array.isArray(entries)) {
    return entries;
  } else if (typeof entries === 'string') {
    return [entries];
  } else {
    return [this.main];
  }
};

Packager.prototype.treeFor = function(treeType, extension) {
  if (this.trees[treeType] && this.trees[treeType][extension]) {
    return this.trees[treeType][extension];
  } else {
    this.trees[treeType] = {
      rootTree: mergeTrees(this.assembled.treesByType(treeType)),
    };
  }

  this.trees[treeType][extension] = funnel(this.trees[treeType].rootTree, {
    include: ['**/*.' + extension]
  });

  return this.trees[treeType][extension];
};

/**
 * Flattens an array of trees and associates each one with a treetype
 *
 * var assoc = package._associateTreesWithTypes([[{}, {}], [{}, {}]], ['test-support', 'legacy']); -> { trees: [{}, {}, {}, {}], treeTypes: ['test-support', 'test-support', 'legacy', 'legacy'] }
 *
 * @param  {[type]} trees     [description]
 * @param  {[type]} treeTypes [description]
 * @return {[type]}           [description]
 */
Packager.prototype._associateTreesWithTypes = function(trees, treeTypes) {
  var _orderedTreeTypes = trees.map(function(_trees, i) {
    return _trees.map(function() { return treeTypes[i]; });
  });

  return {
    treeTypes: flatten(_orderedTreeTypes),
    trees: flatten(trees)
  };
};

Packager.prototype._prepJavaScript = function() {
  var testLoaderTree = rename(this.treeFor('test-support', 'js'), function(relativePath) {
    return 'test-support' + path.sep + relativePath;
  });
  var packagerTree = this.treeFor('packager', 'js');
  var legacy = this.treeFor('legacy', 'js');

  return mergeTrees([packagerTree, testLoaderTree, this.linkedTree, legacy]);
};

Packager.prototype._prepTypes = function() {
  var types = [
    {
      name: this.main,
      type: 'main',
      output: this.outputPaths.app
    },
    {
      name: this.tests,
      type: 'tests',
      output: this.outputPaths.tests
    },
    {
      name: this.shared,
      type: 'shared',
      output: this.outputPaths.shared
    }
  ];
  var guranteedTypes = [this.main, this.tests, this.shared];
  var engines = this.entries.filter(function(entry) {
    return guranteedTypes.indexOf(entry) < 0;
  });

  return types.concat(engines.map(function(engine) {
    return {
      name: engine,
      type: 'engine',
      output: this.outputPaths[engine]
    };
  }, this));
};

Packager.prototype.package = function() {
  this.assembled = this.assembler.assemble();
  var whitelist = this._buildWhiteList(this.whitelist, this.assembler.legacyImports);
  var ordered = this.alignNodesAndDescriptors();
  var orderedNodes = ordered.nodes;
  var orderedDescs = ordered.descs;
  var types = this._prepTypes();

  this.linkedTree = new Linker(orderedNodes, {
    babel: this.assembler.babelOptions,
    whitelist: whitelist,
    treeDescriptors: {
      ordered: orderedDescs,
      map: this.assembled.all()
    },
    legacyImports: this.assembler.legacyImports,
    entries: this.entries
  });

  return defaultStrategy(this.assembler, {
    trees: {
      js: this._prepJavaScript(),
      public: this.assembled.treesByType('public'),
      html: this.assembled.treesByType('index'),
      testem: this.assembled.treesByType('testem'),
      styles: this.assembled.treesByType('styles'),
      legacy: mergeTrees(this.assembled.treesByType('legacy'))
    },
    types: types,
    concatOptions: this.concatOptions,
    sourcemaps: this.sourcemaps
  });

};

module.exports = Packager;
