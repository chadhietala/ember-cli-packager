'use strict';
var funnel = require('broccoli-funnel');
var Assembler = require('ember-cli-assembler');
var Linker = require('ember-cli-linker');
var mergeTrees = require('broccoli-merge-trees');

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
  this.entries = options.entries || [this.assembler.name, this.assembler.testPath];
  this.entries = this.concatEntries(options.entries);
  this.main = this.assembler.name;
  this.outputPaths = this.assembler.options.outputPaths;
  this.whitelist = options.whitelist || [];
}

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
  var whitelist = ['loader.js', 'ember-cli-shims', 'public', 'styles'];

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

Packager.prototype.package = function() {
  this.assembled = this.assembler.assemble();
  var whitelist = this._buildWhiteList(this.whitelist, this.assembler.legacyImports);
  var ordered = this.alignNodesAndDescriptors();
  var orderedNodes = ordered.nodes;
  var orderedDescs = ordered.descs;

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
  // var strategies = [];
  //
  // console.log('here');
  // if (this.composeCustomOutput) {
  //   strategies.push({ name: 'custom', strategy: this.composeCustomOutput});
  // }
  //
  // this.strategies.map(function(strat) {
  //   strategies.push({name: strat, strategy: require('./strategies/' + strat)});
  // });


  return mergeTrees([this.linkedTree].concat(
    this.assembled.treesByType('packager'),
    this.assembled.treesByType('public'),
    this.assembled.treesByType('styles'),
    this.assembled.treesByType('testem'),
    this.assembled.treesByType('legacy')
  ));

  var mergedTree = mergeTrees(strategies.map(function(strat) {
    var tree = strat.strategy(funnel(this.linkedTree), this.main, this.entries, this.outputPaths);
    return funnel(tree, {
      destDir: '/' + strat.name + '-build'
    });
  }, this));

  return this.assembler.addonPostprocessTree('all', mergedTree);
};

function uniq(arr) {
  return arr.reduce(function(a, b) {
    if (a.indexOf(b) < 0) {
      a.push(b);
    }
    return a;
  }, []);
}

function flatten(array) {
  return array.reduce(function(a, b) {
    return a.concat(b);
  });
}

module.exports = Packager;
