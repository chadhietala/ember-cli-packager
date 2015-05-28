'use strict';
var stew = require('broccoli-stew');
var env = stew.env;

function addMainPackagerGlobs(globs) {
  var appPrefix = '__packager__/app-prefix.js';
  var appSuffix = '__packager__/app-suffix.js';
  var appBoot = '__packager__/app-boot.js';

  globs.unshift(appPrefix);
  globs.push(appSuffix, appBoot);
}

function addTestGlobs(globs) {
  var testSupportPrefix = '__packager__/test-support-prefix.js';
  var testSupportSuffix = '__packager__/test-support-suffix.js';
  var tests = '**/tests/**/*.js';

  env('!production', function() {
    globs.unshift(testSupportPrefix, testSupportSuffix);
    globs.push(tests);
  });
}

function addVendorGlobs(globs) {
  var prefix = '__packager__/vendor-prefix.js';
  var suffix = '__packager__/vendor-suffix.js';
  globs.unshift(prefix);
  globs.push(suffix);
}

function globsFor(type, globs) {
  switch (type) {
    case 'main': addMainPackagerGlobs(globs); break;
    case 'vendor': addVendorGlobs(globs); break;
    case 'test': addTestGlobs(globs); break;
  }

  return globs;
}

module.exports = globsFor;