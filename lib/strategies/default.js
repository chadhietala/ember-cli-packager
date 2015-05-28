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

function html(tree, main) {
  var index;

  env('production', function() {
    index = find(tree, {
      include: [main + '/**/*.html'],
      exclude: [main + '/tests/']
    });
  });

  env('!production', function () {
    index = find(tree, {
      include: [main + '/**/*.html']
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

  var inputFiles = [];
  tree = stew.map(find(tree, {
    include: inclusionGlobs,
    exclude: exclusionGlobs
  }), function(str, relativePath) {
    if (relativePath.indexOf('__packager__') < 0 && relativePath.indexOf(main) < 0 && relativePath.indexOf('-shims.js') < 0 && relativePath.indexOf('loader.js') < 0 && relativePath === 'ember.js' && relativePath === 'jquery.js') {
      inputFiles.push(relativePath);
    }
    return str;
  });

  inputFiles.unshift('ember.js');
  return concat(tree, {
    headerFiles: ['loader.js'],
    inputFiles: inputFiles,
    footerFiles: ['app-shims.js'],
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

function testSupport(tree) {
  return find(tree, {include: [ 'test-support']});
}

module.exports = function(tree, main, entries, outputPaths) {
  tree = stew.log(tree);
  var trees = [
    app(tree, main, outputPaths),
    testSupport(tree, outputPaths),
    vendor(tree, main, outputPaths)
  ];

  return mergeTrees(flatten(trees));
};
