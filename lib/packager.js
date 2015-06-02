'use strict';
var funnel = require('broccoli-funnel');
var Assembler = require('ember-cli-assembler');
var PrePackager = require('ember-cli-linker');
var mergeTrees = require('broccoli-merge-trees');
var stew = require('broccoli-stew');
/**
 * new Packager({
 *  strategies: ['default', 'http2', 'custom'], // defaults to `default`
 *  includeServiceWorker: true, // optional
 *  entries: ['example-app', 'example-engine'] // required but could be pulled from config
 *  composeOutput: function(bfs, graph) {} // Optional
 * });
 */

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
  // TODO should I just pass the options without inspecting? Perhaps the options
  // need to be split in the 2 parts, Builder and Packager?
  this.assembler = new Assembler(options);
  options.entries = options.entries || [this.assembler.name, this.assembler.testPath];
  this.entries = this.concatEntries(options.entries);
  this.main = this.assembler.name;
  this.outputPaths = this.assembler.options.outputPaths;
  this.builtTrees = this.assembler.toTree();
  this.prePackagedTree = new PrePackager(this.builtTrees, {
    whitelist: this.assembler.legacyPackages,
    treeDescriptors: this.assembler.treeDescriptors,
    legacyImports: this.assembler.legacyImports,
    entries: options.entries
  });
}

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
  var strategies = [];

  if (this.composeCustomOutput) {
    strategies.push({ name: 'custom', strategy: this.composeCustomOutput});
  }

  this.strategies.map(function(strat) {
    strategies.push({name: strat, strategy: require('./strategies/' + strat)});
  });

  return this.prePackagedTree;
  var mergedTree = mergeTrees(strategies.map(function(strat) {
    var tree = strat.strategy(funnel(this.prePackagedTree), this.main, this.entries, this.outputPaths);
    return funnel(tree, {
      destDir: '/' + strat.name + '-build'
    });
  }, this));

  return this.builder.addonPostprocessTree('all', mergedTree);
};



module.exports = Packager;
