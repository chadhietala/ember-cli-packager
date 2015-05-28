'use strict';
var funnel = require('broccoli-funnel');
var Builder = require('ember-cli-builder');
var PrePackager = require('ember-cli-pre-packager');
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
  this.builder = new Builder(options);
  options.entries = options.entries || [this.builder.name, this.builder.testPath];
  this.entries = this.concatEntries(options.entries);
  this.main = this.builder.name;
  this.outputPaths = this.builder.options.outputPaths;
  this.builtTrees = this.builder.toTree();
  this.prePackagedTree = new PrePackager(this.builtTrees, {
    treeDescriptors: this.builder.treeDescriptors,
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

  var mergedTree = mergeTrees(strategies.map(function(strat) {
    var tree = strat.strategy(funnel(this.prePackagedTree), this.main, this.entries, this.outputPaths);
    return funnel(tree, {
      destDir: '/' + strat.name + '-build'
    });
  }, this));

  return this.builder.addonPostprocessTree('all', mergedTree);
};



module.exports = Packager;
