'use strict';

var Packager = require('../../lib/packager');
var expect = require('chai').expect;

describe('packager unit', function() {
  var packager;
  var cwd = process.cwd();

  beforeEach(function() {
    process.chdir('./tests/fixtures/dummy');
  });

  afterEach(function() {
    process.chdir(cwd);
    if (packager) {
      packager = null;
    }
  });

  it('should return the passed entries', function() {
    packager = new Packager({
      entries: ['foo', 'foo/tests']
    });

    expect(packager.entries).to.deep.eql(['foo', 'foo/tests']);
  });

  it('should default to the app name and it\'s tests', function() {
    packager = new Packager();

    expect(packager.entries).to.deep.eql(['dummy', 'dummy/tests']);
  });
});
