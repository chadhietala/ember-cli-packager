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
    process.chdir('tests/fixtures/dummy');
  });

  afterEach(function() {
    if (builder) {
      builder = null;
    }
    packager = null;
    process.chdir(cwd);
  });

  it('should have the linker link the files that are reachable in the graph', function() {

    packager = new Packager({
      entries: ['dummy', 'dummy/tests']
    });

    packager.import('bower_components/some/bower-thing.js', { exports: { some: ['default'] } });
    packager.package();

    builder = new broccoli.Builder(packager.linkedTree);

    return builder.build().then(function(results) {
      expect(listFiles(results.directory)).to.deep.equal([
        'browserified-bundle.js',
        'dummy/app.js',
        'dummy/components/baz-bar.js',
        'dummy/components/foo-bar.js',
        'dummy/config/environment.js',
        'dummy/index.js',
        'dummy/loader.js',
        'dummy/pods/foo-baz/component.js',
        'dummy/pods/foo-baz/template.js',
        'dummy/router.js',
        'dummy/templates/components/foo-bar.js',
        'dummy/templates/profile.js',
        'dummy/test-index.js',
        'dummy/tests/unit/components/foo-bar-test.js',
        'ember-qunit.js',
        'ember.js',
        'ember/get.js'
      ]);
    });
  });

  it('should handle app imports correctly', function() {
    packager = new Packager({
      entries: ['dummy', 'dummy/tests']
    });

    packager.import('bower_components/some/bower-thing.js', { exports: { some: ['default'] } });
    packager.package();

    builder = new broccoli.Builder(packager.builtTree);

    return builder.build().then(function(results) {
      expect(listFiles(results.directory).indexOf('some/bower-thing.js') > -1).to.be.ok;
    });
  });

  it('should still output file if no exports were passed', function() {
    packager = new Packager({
      entries: ['dummy', 'dummy/tests']
    });

    packager.import('bower_components/some/bower-thing.js', { exports: { some: ['default'] } });
    packager.import('bower_components/other/thing.js');
    packager.package();

    builder = new broccoli.Builder(packager.builtTree);

    return builder.build().then(function(results) {
      expect(listFiles(results.directory).indexOf('other/thing.js') > -1).to.be.ok;
    });
  });

  it('should be able to pull from vendor', function() {
    packager = new Packager({
      entries: ['dummy', 'dummy/tests']
    });

    packager.import('vendor/vendored/a.js');
    packager.import('bower_components/some/bower-thing.js', { exports: { some: ['default'] } });
    packager.package();

    builder = new broccoli.Builder(packager.builtTree);

    return builder.build().then(function(results) {
      expect(listFiles(results.directory).indexOf('vendored/a.js') > -1).to.be.ok;
    });
  });

  describe('default concat strategy', function() {
    it.only('should output the correct concat files', function() {
      packager = new Packager({
        entries: ['dummy', 'dummy/tests']
      });
      packager.import('bower_components/some/bower-thing.js', { exports: { some: ['default'] } });

      var dist = packager.package();

      builder = new broccoli.Builder(dist);

      return builder.build().then(function(results) {
        expect(listFiles(results.directory)).to.deep.eql([
          'assets/failed.png',
          'assets/passed.png',
          'assets/dummy.css',
          'assets/dummy-tests.js',
          'assets/dummy-tests.map',
          'assets/dummy.js',
          'assets/dummy.map',
          'assets/shared.js',
          'assets/shared.map',
          'assets/vendor.css',
          'assets/test-support.css',
          'tests/index.html',
          'crossdomain.xml',
          'testem.js',
          'index.html'
        ]);
      });
    });

    it.skip('should include the tests and should be test mode', function() {

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


    it.skip('should not incude the tests and shouldn\'t be test mode when building for production', function() {

      process.env.EMBER_ENV = 'production';

      packager = new Packager({
        entries: ['dummy']
      });

      var dist = packager.package();

      builder = new broccoli.Builder(dist);

      return builder.build().then(function(results) {
        process.env.EMBER_ENV = 'development';
        var tests = fs.readFileSync(results.directory + '/default-build/assets/dummy.js', 'utf8');
        expect(tests.indexOf('runningTests = true;')).to.be.lt(0);
        expect(tests.indexOf('moduleForComponent(\'foo-bar\'')).to.be.lt(0);
        expect(tests.indexOf('FROM_TEST_SUPPORT')).to.be.lt(0);
        expect(tests.indexOf('if (runningTests)')).to.be.gt(-1);
      });
    });

  });

  describe.skip('http2 concat strategy', function() {

    it('should output granular files', function() {
        packager = new Packager({
          entries: ['dummy'],
          strategies: ['http2']
        });

        var dist = packager.package();

        builder = new broccoli.Builder(dist);

        return builder.build().then(function(results) {
          expect(listFiles(results.directory)).to.deep.eql([
            'http2-build/dummy-tests/index.html',
            'http2-build/dummy-tests/index.js',
            'http2-build/dummy-tests/index.map',
            'http2-build/dummy-tests/test-support/baz.js',
            'http2-build/dummy-tests/testem.js',
            'http2-build/dummy-tests/unit/components/foo-bar-test.js',
            'http2-build/dummy/app.js',
            'http2-build/dummy/components/baz-bar.js',
            'http2-build/dummy/components/foo-bar.js',
            'http2-build/dummy/config/environment.js',
            'http2-build/dummy/crossdomain.xml',
            'http2-build/dummy/index.html',
            'http2-build/dummy/index.js',
            'http2-build/dummy/index.map',
            'http2-build/dummy/pods/bizz-buzz/component.js',
            'http2-build/dummy/pods/bizz-buzz/template.js',
            'http2-build/dummy/pods/foo-baz/component.js',
            'http2-build/dummy/pods/foo-baz/template.js',
            'http2-build/dummy/robots.txt',
            'http2-build/dummy/router.js',
            'http2-build/dummy/styles/app.css',
            'http2-build/dummy/templates/components/foo-bar.js',
            'http2-build/dummy/templates/profile.js',
            'http2-build/ember/ember.js',
            'http2-build/ember/ember/get.js'
          ]);
        });
    });

    it('should output only app files in production', function() {
      process.env.EMBER_ENV = 'production';
      packager = new Packager({
        entries: ['dummy'],
        strategies: ['http2']
      });

      var dist = packager.package();

      builder = new broccoli.Builder(dist);

      return builder.build().then(function(results) {
        process.env.EMBER_ENV = 'development';
        expect(listFiles(results.directory)).to.deep.eql([
          'http2-build/dummy/app.js',
          'http2-build/dummy/components/baz-bar.js',
          'http2-build/dummy/components/foo-bar.js',
          'http2-build/dummy/config/environment.js',
          'http2-build/dummy/crossdomain.xml',
          'http2-build/dummy/index.html',
          'http2-build/dummy/index.js',
          'http2-build/dummy/index.map',
          'http2-build/dummy/pods/bizz-buzz/component.js',
          'http2-build/dummy/pods/bizz-buzz/template.js',
          'http2-build/dummy/pods/foo-baz/component.js',
          'http2-build/dummy/pods/foo-baz/template.js',
          'http2-build/dummy/robots.txt',
          'http2-build/dummy/router.js',
          'http2-build/dummy/styles/app.css',
          'http2-build/dummy/templates/components/foo-bar.js',
          'http2-build/dummy/templates/profile.js',
          'http2-build/ember/ember.js',
          'http2-build/ember/ember/get.js'
        ]);

      });
    });
  });
});
