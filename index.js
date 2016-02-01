import encapsulateCss from 'encapsulate-css';
import through2 from 'through2';
import gutil from 'gulp-util';
import findup from 'findup-sync';
import path from 'path';
import at from 'lodash.at';
import fs from 'fs';

function simpleCache(f) {
    const cache = {};
    return (k) => {
        if (!cache[k]) {
            cache[k] = f(k);
        }
        return cache[k];
    };
}

export default function cssEncapsulatingStream(opts) {
    const packagePathCache = simpleCache((directory) => {
        const packagePath = findup('package.json', {cwd: directory});
        if (!packagePath) {
            throw new Error(`Unable to find a package.json in ${directory} or its ancestors.`);
        }
        return packagePath;
    });
    const pkgFromPath = (packagePath) => JSON.parse(fs.readFileSync(packagePath));
    const classnameFromPkg = (pkg) => `${pkg.name.replace(/[@\/]/g, '_')}_${pkg.version.replace(/\./g, '_')}`;
    const isAppliedFromPkg = (optIn, optKey) => (pkg) => {
        const optVal = at(pkg, optKey)[0];
        if (optIn) {
            if (!optVal) return false;
        } else { // optOut
            if (optVal) return false;
        }
        return true;
    };
    const processPackage = (optIn, optKey) => {
        const calcIsApplied = isAppliedFromPkg(optIn, optKey);
        return simpleCache((filename)=>{
            const directory = path.dirname(filename);
            const packagePath = packagePathCache(directory);
            const pkg = pkgFromPath(packagePath);
            const isApplied = calcIsApplied(pkg);
            return {isApplied, className: isApplied ? classnameFromPkg(pkg) : undefined};
        });
    };
    // big assumption here that state.opts is immutable
    const getProcessPackageForOpts = simpleCache(({
            optIn=false, // optOut by default (by including this plugin you're opting in)
            optKey='cssMain', // keyPath for optIn or optOut
            // TODO: let someone specify a pattern to use via package.json
        }={})=>processPackage(optIn, optKey));

    const getEncapsulateData = getProcessPackageForOpts(opts);

    return through2.obj(function encapsulateCssStream(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            cb(new gutil.PluginError('gulp-encapsulate', 'Streaming not supported'));
            return;
        }

        try {
            const {className, isApplied} = getEncapsulateData(file.path);
            if (!isApplied) {
                return cb(null, file);
            }
            const code = encapsulateCss(file.contents.toString(), className);

            file.contents = new Buffer(code);
            this.push(file);
        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-encapsulate-css', err, {
                fileName: file.path,
                showProperties: false,
            }));
        }
        cb();
    });
}

