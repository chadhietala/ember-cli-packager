'use strict';

var Packager = require('../../lib/packager');
var expect = require('chai').expect;
var broccoli = require('broccoli');
var walkSync = require('walk-sync');

describe('Packager', function() {
  var builder,
      packager;

  it('should do something', function() {
    process.chdir('tests/fixtures/dummy');
    packager = new Packager({
      entries: ['dummy']
    });

    builder = new broccoli.Builder(packager.prePackagedTree);

    return builder.build().then(function(results) {
      console.log(walkSync(results.directory));
    });

    
  });
});
