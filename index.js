'use strict';

const babel = require('babel-core');
const anymatch = require('anymatch');

const reIg = /^(bower_components|node_modules\/[.-\w]-brunch|vendor)/;
const reJsx = /\.(es6|jsx|js)$/;

class BabelCompiler {
  constructor(config) {
    if (!config) config = {};
    const options = config.plugins &&
      (config.plugins.babel || config.plugins.ES6to5) || {};
    const opts = Object.keys(options).reduce((obj, key) => {
      if (key !== 'sourceMaps' && key !== 'ignore') {
        obj[key] = options[key];
      }
      return obj;
    }, {});
    opts.sourceMaps = !!config.sourceMaps;
    if (opts.pattern) {
      this.pattern = opts.pattern;
      delete opts.pattern;
    }
    if (!opts.presets) opts.presets = ['es2015'];
    if (opts.presets.indexOf('react') !== -1) this.pattern = reJsx;
    if (opts.presets.length === 0) delete opts.presets;
    this.isIgnored = anymatch(options.ignore || reIg);
    this.options = opts;
  }

  compile(params) {
    if (this.isIgnored(params.path)) return Promise.resolve(params);

    this.options.filename = params.path;
    // set source target to the full file path
    this.options.sourceMapTarget = params.path;
    this.options.sourceFileName = params.path;
    // set input source maps if present from previous plugins
    this.options.inputSourceMap = params.map;

    return new Promise((resolve, reject) => {
      let compiled;
      try {
        compiled = babel.transform(params.data, this.options);
      } catch (err) {
        return reject(err);
      }
      var result = {data: compiled.code || compiled};

      // Concatenation is broken by trailing comments in files, which occur
      // frequently when comment nodes are lost in the AST from babel.
      // DocX update: do not add it as it can mess with source maps. concatenation works in brunch
      // as it is done after wrapping
      //result.data += '\n';

      if (compiled.map) result.map = JSON.stringify(compiled.map);
      resolve(result);
    });
  }
}

BabelCompiler.prototype.brunchPlugin = true;
BabelCompiler.prototype.type = 'javascript';
BabelCompiler.prototype.extension = 'js';

module.exports = BabelCompiler;
