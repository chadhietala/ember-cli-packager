'use strict';
var funnel = require('broccoli-funnel');
var Builder = require('ember-cli-builder');
var PrePackager = require('ember-cli-pre-packager');
var mergeTrees = require('broccoli-merge-trees');
/**
 * new Packager({
 *  strategies: ['default', 'http2', 'custom'], // defaults to `default`
 *  includeServiceWorker: true, // optional
 *  entries: ['example-app', 'example-engine'] // required but could be pulled from config
 *  composeOutput: function(bfs, graph) {} // Optional
 * });
 */

function Packager(options) {
  this.strategies = options.strategies || ['default'];
  this.composeCustomOutput = options.composeCustomOutput || null;
  this.builtTrees = new Builder().toTree();
  this.prePackagedTree = new PrePackager(this.builtTrees, {
    entries: options.entries
  });

  this.entries = options.entries;
  
  return this.package();
}

Packager.prototype.package = function() {
  var strategies = [];
  
  if (this.composeCustomOutput) {
    strategies.push({ name: 'custom', strategy: this.composeCustomOutput});
  }

  this.strategies.map(function(strat) {
    strategies.push({name: strat, strategy: require('./strategies/' + strat)});
  });

  // return mergeTrees(strategies.map(function(strat) {
  //   var tree = strat.strategy(funnel(this.prePackagedTree), this.entries);
  //   return funnel(tree, {
  //     destDir: '/' + strat.name + '-build'
  //   });
  // }, this));
};



module.exports = Packager;
