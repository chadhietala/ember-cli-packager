'use strict';

function getOutputPathFor(types, searchType, extension) {
  var output = types.filter(function(type) {
    return type.type === searchType;
  })[0];

  if (output && output.output && output.output[extension]) {
    return output.output[extension];
  }
}

module.exports = getOutputPathFor;
