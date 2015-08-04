'use strict';
var funnel = require('broccoli-funnel');

module.exports = function(tree) {
  return funnel(tree, {
    exclude: ['legacy/**/*.js', 'legacy/**/*.css']
  });
};
