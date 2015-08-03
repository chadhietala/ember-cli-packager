'use strict';

var Plugin = require('broccoli-plugin');
var concat = require('broccoli-sourcemap-concat');
var mergeTrees = require('broccoli-merge-trees');

module.exports = BaseStrategy;

BaseStrategy.prototype = Object.create(Plugin.prototype);
BaseStrategy.prototype.constructor = BaseStrategy;

function BaseStrategy(inputNodes, options) {
  if (!(this instanceof BaseStrategy)) {
    return new BaseStrategy(inputNodes, options);
  }

  Plugin.call(this, inputNodes, {
    annotation: 'Default Ember Build'
  });

  if (!inputNodes[0].subgraphs) {
    throw new Error('The first tree passed to a strategy is expected to be the linked tree.');
  }

  this.inputTree = mergeTrees(inputNodes);

  if (!this.linkedTree.subgraphs) {
    throw new Error('The linked tree was not passed as the first tree or there is an issue with the linked tree. This is most liekly a bug with Ember CLI, please file a bug at http://github.com/ember-cli/ember-cli/issues');
  }

  this.options = options || {};
  this.entries = this.options.entries;
}

BaseStrategy.prototype._concat = function() {
  return concat.apply(null, arguments);
};
