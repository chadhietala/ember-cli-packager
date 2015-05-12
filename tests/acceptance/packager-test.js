'use strict';

var Packager = require('../../lib/packager');
var expect = require('chai').expect;
var broccoli = require('broccoli');
var walkSync = require('walk-sync');
var fs = require('fs');
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
        'dummy-tests/test-support/baz.js',
        'dummy-tests/testem.js',
        'dummy-tests/unit/components/foo-bar-test.js',
        'dummy/app.js',
        'dummy/components/baz-bar.js',
        'dummy/components/foo-bar.js',
        'dummy/config/environment.js',
        'dummy/crossdomain.xml',
        'dummy/dep-graph.json',
        'dummy/index.html',
        'dummy/index.js',
        'dummy/pods/bizz-buzz/component.js',
        'dummy/pods/bizz-buzz/template.js',
        'dummy/pods/foo-baz/component.js',
        'dummy/pods/foo-baz/template.js',
        'dummy/robots.txt',
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
  
  describe('default concat strategy', function() {

    it('should output the correct concat files', function() {
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
          'default-build/dummy-tests/testem.js',
          'default-build/index.html'
        ]);
      });
    });

    it('should include the tests and should be test mode', function() {
      
      packager = new Packager({
        entries: ['dummy']
      });

      var dist = packager.package();

      builder = new broccoli.Builder(dist);

      return builder.build().then(function(results) {
        var tests = fs.readFileSync(results.directory + '/default-build/assets/dummy.js', 'utf8');
        expect(tests.indexOf('runningTests = true;')).to.be.gt(-1);
        expect(tests.indexOf('moduleForComponent(\'foo-bar\'')).to.be.gt(-1);
        expect(tests.indexOf('FROM_TEST_SUPPORT')).to.be.gt(-1);
        expect(tests.indexOf('if (runningTests)')).to.be.gt(-1);
      });
    });


    it('should not incude the tests and shouldn\'t be test mode when building for production', function() {
      
      process.env.EMBER_ENV = 'production';

      packager = new Packager({
        entries: ['dummy']
      });

      var dist = packager.package();

      builder = new broccoli.Builder(dist);

      return builder.build().then(function(results) {
        var tests = fs.readFileSync(results.directory + '/default-build/assets/dummy.js', 'utf8');
        expect(tests.indexOf('runningTests = true;')).to.be.lt(0);
        expect(tests.indexOf('moduleForComponent(\'foo-bar\'')).to.be.lt(0);
        expect(tests.indexOf('FROM_TEST_SUPPORT')).to.be.lt(0);
        expect(tests.indexOf('if (runningTests)')).to.be.gt(-1);
        process.env.EMBER_ENV = 'development';
      });
    });

  });
});
