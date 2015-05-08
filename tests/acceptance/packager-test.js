'use strict';

var Packager = require('../../lib/packager');
var expect = require('chai').expect;
var broccoli = require('broccoli');
var walkSync = require('walk-sync');
var cwd = process.cwd();

describe('Packager', function() {
  var builder,
      packager;

  function listFiles(directory) {
    return walkSync(directory).filter(function(relativePath) {
      return relativePath.slice(-1) !== '/';
    }).sort();
  }

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
      expect(listFiles(results.directory)).to.deep.equal([
        '__packager__/app-boot.js',
        '__packager__/app-prefix.js',
        '__packager__/app-suffix.js',
        '__packager__/test-support-prefix.js',
        '__packager__/test-support-suffix.js',
        '__packager__/vendor-prefix.js',
        '__packager__/vendor-suffix.js',
        'browserified/ember-qunit/ember-qunit-legacy.js',
        'dummy-tests/dep-graph.json',
        'dummy-tests/index.html',
        'dummy-tests/unit/components/foo-bar-test.js',
        'dummy/app.js',
        'dummy/components/baz-bar.js',
        'dummy/components/foo-bar.js',
        'dummy/config/environment.js',
        'dummy/dep-graph.json',
        'dummy/index.html',
        'dummy/pods/bizz-buzz/component.js',
        'dummy/pods/bizz-buzz/template.js',
        'dummy/pods/foo-baz/component.js',
        'dummy/pods/foo-baz/template.js',
        'dummy/router.js',
        'dummy/styles/app.css',
        'dummy/templates/components/foo-bar.js',
        'dummy/templates/profile.js',
        'ember-qunit/dep-graph.json',
        'ember-qunit/ember-qunit.js',
        'ember/dep-graph.json',
        'ember/ember.js',
        'ember/ember/get.js'
      ]);
    });    
  });

  it('should follow the default concat strategy', function() {
    packager = new Packager({
      entries: ['dummy']
    });

    var dist = packager.package();

    builder = new broccoli.Builder(dist);

    return builder.build().then(function(results) {
      expect(listFiles(results.directory)).to.deep.eql([
        'default-build/assets/dummy.css',
        'default-build/assets/dummy.js',
        'default-build/assets/dummy.map',
        'default-build/assets/vendor.css',
        'default-build/assets/vendor.js',
        'default-build/assets/vendor.map',
        'default-build/index.html'
      ]);
    });
  });
});
