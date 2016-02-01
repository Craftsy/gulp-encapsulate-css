'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = cssEncapsulatingStream;

var _encapsulateCss = require('encapsulate-css');

var _encapsulateCss2 = _interopRequireDefault(_encapsulateCss);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _findupSync = require('findup-sync');

var _findupSync2 = _interopRequireDefault(_findupSync);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash.at');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function simpleCache(f) {
    var cache = {};
    return function (k) {
        if (!cache[k]) {
            cache[k] = f(k);
        }
        return cache[k];
    };
}

function cssEncapsulatingStream(opts) {
    var packagePathCache = simpleCache(function (directory) {
        var packagePath = (0, _findupSync2.default)('package.json', { cwd: directory });
        if (!packagePath) {
            throw new Error('Unable to find a package.json in ' + directory + ' or its ancestors.');
        }
        return packagePath;
    });
    var pkgFromPath = function pkgFromPath(packagePath) {
        return JSON.parse(_fs2.default.readFileSync(packagePath));
    };
    var classnameFromPkg = function classnameFromPkg(pkg) {
        return pkg.name.replace(/[@\/]/g, '_') + '_' + pkg.version.replace(/\./g, '_');
    };
    var isAppliedFromPkg = function isAppliedFromPkg(optIn, optKey) {
        return function (pkg) {
            var optVal = (0, _lodash2.default)(pkg, optKey)[0];
            if (optIn) {
                if (!optVal) return false;
            } else {
                // optOut
                if (optVal) return false;
            }
            return true;
        };
    };
    var processPackage = function processPackage(optIn, optKey) {
        var calcIsApplied = isAppliedFromPkg(optIn, optKey);
        return simpleCache(function (filename) {
            var directory = _path2.default.dirname(filename);
            var packagePath = packagePathCache(directory);
            var pkg = pkgFromPath(packagePath);
            var isApplied = calcIsApplied(pkg);
            return { isApplied: isApplied, className: isApplied ? classnameFromPkg(pkg) : undefined };
        });
    };
    // big assumption here that state.opts is immutable
    var getProcessPackageForOpts = simpleCache(function () {
        var _ref = arguments.length <= 0 || arguments[0] === undefined ? // keyPath for optIn or optOut
        // TODO: let someone specify a pattern to use via package.json
        {} : arguments[0];

        var _ref$optIn = _ref.optIn;
        var optIn = _ref$optIn === undefined ? false : _ref$optIn;
        var _ref$optKey = _ref.optKey;
        var // optOut by default (by including this plugin you're opting in)
        optKey = _ref$optKey === undefined ? 'cssMain' : _ref$optKey;
        return processPackage(optIn, optKey);
    });

    var getEncapsulateData = getProcessPackageForOpts(opts);

    return _through2.default.obj(function encapsulateCssStream(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            cb(new _gulpUtil2.default.PluginError('gulp-encapsulate', 'Streaming not supported'));
            return;
        }

        try {
            var _getEncapsulateData = getEncapsulateData(file.path);

            var className = _getEncapsulateData.className;
            var isApplied = _getEncapsulateData.isApplied;

            if (!isApplied) {
                return cb(null, file);
            }
            var code = (0, _encapsulateCss2.default)(file.contents.toString(), className);

            file.contents = new Buffer(code);
            this.push(file);
        } catch (err) {
            this.emit('error', new _gulpUtil2.default.PluginError('gulp-encapsulate-css', err, {
                fileName: file.path,
                showProperties: false
            }));
        }
        cb();
    });
}