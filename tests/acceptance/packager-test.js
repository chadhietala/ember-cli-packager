'use strict';

var Packager = require('../../lib/packager');
var expect = require('chai').expect;
var broccoli = require('broccoli');
var walkSync = require('walk-sync');
var cwd = process.cwd();

describe('Packager', function() {
  var builder,
      packager;

  beforeEach(function() {
    if (builder) {
      builder = null;
    }
    process.chdir('tests/fixtures/dummy');
  });

  afterEach(function() {
    process.chdir(cwd);
  });

  it('should have the pre-packager traverse the graph', function() {
    
    packager = new Packager({
      entries: ['dummy']
    });

    builder = new broccoli.Builder(packager.prePackagedTree);

    return builder.build().then(function(results) {
      expect(walkSync(results.directory).sort()).to.deep.equal([
        'dummy-tests/',
        'dummy-tests/dep-graph.json',
        'dummy-tests/index.html',
        'dummy-tests/unit/',
        'dummy-tests/unit/components/',
        'dummy-tests/unit/components/foo-bar-test.js',
        'dummy/',
        'dummy/app.js',
        'dummy/components/',
        'dummy/components/baz-bar.js',
        'dummy/components/foo-bar.js',
        'dummy/dep-graph.json',
        'dummy/index.html',
        'dummy/pods/',
        'dummy/pods/bizz-buzz/',
        'dummy/pods/bizz-buzz/component.js',
        'dummy/pods/bizz-buzz/template.js',
        'dummy/pods/foo-baz/',
        'dummy/pods/foo-baz/component.js',
        'dummy/pods/foo-baz/template.js',
        'dummy/router.js',
        'dummy/styles/',
        'dummy/styles/app.css',
        'dummy/templates/',
        'dummy/templates/components/',
        'dummy/templates/components/foo-bar.js',
        'dummy/templates/profile.js',
        'ember-qunit/',
        'ember-qunit/dep-graph.json',
        'ember-qunit/ember-qunit.js',
        'ember/',
        'ember/dep-graph.json',
        'ember/ember.js',
        'ember/ember/',
        'ember/ember/get.js'
      ]);
    });    
  });
});
