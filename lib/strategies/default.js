'use strict';

var mergeTrees = require('broccoli-merge-trees');
var concat = require('broccoli-sourcemap-concat');
var stew = require('broccoli-stew');
var find = stew.find;
var env = stew.env;

function flatten(arr) {
  return [].concat.apply([], arr);
}

function javascript(tree, main, outputPaths) {
  var globs = [
    main + '/**/*.js',
    '__packager__/app-prefix.js',
    '__packager__/app-suffix.js',
    '__packager__/app-boot.js'
  ];
  var appJs;

  env('production', function() {
    appJs = find(tree, {
      include: globs,
      exclude: [main + '/tests/']
    });
  });

  appJs = find(tree, {
    include: globs
  });

  return concat(appJs, {
    inputFiles: [main + '/**/*.js'],
    headerFiles: ['__packager__/app-prefix.js'],
    footerFiles: [
      '__packager__/app-suffix.js',
      '__packager__/app-boot.js'
    ],
    outputFile: outputPaths.app.js,
    description: 'Concat: App'
  });
}

function styles(tree, main, outputPaths) {
  return concat(tree, {
    inputFiles: [main + '/**/*.css'],
    outputFile: outputPaths.app.css.app
  });
}

function html(tree) {
  var index;

  env('production', function() {
    index = find(tree, {
      include: ['*.html'],
      exclude: ['/tests/*.html']
    });
  });

  env('!production', function () {
    index = find(tree, {
      include: ['**/*.html']
    });
  });

  return index;
}


function app(tree, main, outputPaths) {
  var trees = [];
  trees.push(javascript(tree, main, outputPaths));
  trees.push(styles(tree, main, outputPaths));
  trees.push(html(tree, main, outputPaths));

  return trees;
}

function vendorJavascript(tree, main, outputPaths) {
  var exclusionGlobs = [
    main,
    '__packager__/app-*.js'
  ];
  var inclusionGlobs = [
    'loader.js',
    '__packager__/vendor-prefix.js',
    '**/**/*.js',
    '__packager__/vendor-suffix.js'
  ];

  tree = find(tree, {
    include: inclusionGlobs,
    exclude: exclusionGlobs
  });
  var headerFiles = [ main + '/loader.js' ];

  var f = [];
  return concat(stew.rename(tree, function(relativePath) {
    if (headerFiles.indexOf(relativePath) < 0) {
      f.push(relativePath);
    }
    return relativePath;
  }), {
    headerFiles: headerFiles,
    inputFiles: f,
    outputFile: outputPaths.vendor.js
  });
}

function vendorStyles(tree, main, outputPaths) {
  var relativePaths = [];

  var vendorCss = stew.rename(find(tree, { exclude:[main + '/**/*.css'] }), function(relativePath) {
    relativePaths.push(relativePath);
    return relativePath;
  });

  var containsVendorCss = relativePaths.some(function(relativePath) {
    return relativePath.indexOf('.css') > -1;
  });

  if (containsVendorCss) {
    return concat(vendorCss, {
      inputFiles: ['**/**/*.css'],
      outputFile: outputPaths.vendor.css
    });
  } else {
    return false;
  }
}

function vendor(tree, main, outputPaths) {
  var trees = [];
  var vendorStylesTree = vendorStyles(tree, main, outputPaths);
  trees.push(vendorJavascript(tree, main, outputPaths));
  if (vendorStylesTree) {
    trees.push(vendorStylesTree);
  }
  return trees;
}

function testSupport(tree, outputPaths) {
  return concat(find(tree, {include: [ 'test-support/**/*.js']}), {
    inputFiles: ['**/**/*.js'],
    outputFile: outputPaths.testSupport.js.testSupport
  });
}


module.exports = function(tree, projectName, outputPaths) {
  var trees = [
    app(tree, projectName, outputPaths),
    testSupport(tree, outputPaths),
    vendor(tree, projectName, outputPaths)
  ];

  return mergeTrees(flatten(trees));
};
