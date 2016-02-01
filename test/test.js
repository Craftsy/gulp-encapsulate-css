import {expect} from 'chai';
import gulpEncapsulateCss from '../index';
import File from 'vinyl';
import path from 'path';
import b from 'cssbeautify';

const sampleCss = `div {
    background-color: black;
}

h1.bigHeader {
    color: green;
}

p {
    color: white;
    font-size: 14px;
}

p > span {
    color: blue;
}

p + span, p ~ span {
    color: red;
}

p[lang=en]:first {
    color: white;
}

@keyframes identifier {
  0% { top: 0; left: 0; }
  30% { top: 50px; }
  68%, 72% { left: 50px; }
  100% { top: 100px; left: 100%; }
}`;

const expectedCss = `div.normal-package_1_0_0 {
    background-color: black;
}

h1.bigHeader.normal-package_1_0_0 {
    color: green;
}

p.normal-package_1_0_0 {
    color: white;
    font-size: 14px;
}

p.normal-package_1_0_0 > span.normal-package_1_0_0 {
    color: blue;
}

p.normal-package_1_0_0 + span.normal-package_1_0_0,
p.normal-package_1_0_0 ~ span.normal-package_1_0_0 {
    color: red;
}

p[lang=en].normal-package_1_0_0:first {
    color: white;
}

@keyframes identifier {
    0% {
        top: 0;
        left: 0;
    }

    30% {
        top: 50px;
    }

    68%, 72% {
        left: 50px;
    }

    100% {
        top: 100px;
        left: 100%;
    }
}`;

describe('gulp-encapsulate-css', function() {
    it('encapsulates css', function(done) {
        const fakeFile = new File({
            contents: new Buffer(sampleCss),
            path: path.join(__dirname, './fixtures/normal/yay.css'),
        });
        const encapsulateCss = gulpEncapsulateCss();
        encapsulateCss.write(fakeFile);
        encapsulateCss.once('data', function(file) {
            expect(file.isBuffer()).to.be.true;
            expect(b(file.contents.toString('utf8'))).to.equal(b(expectedCss));
            done();
        });
    });
    it('defaults config option optIn to false', function(done) {
        const fakeFile = new File({
            contents: new Buffer(sampleCss),
            path: path.join(__dirname, './fixtures/normal/yay.css'),
        });
        const encapsulateCss = gulpEncapsulateCss();
        encapsulateCss.write(fakeFile);
        encapsulateCss.once('data', function(file) {
            expect(file.isBuffer()).to.be.true;
            expect(b(file.contents.toString('utf8'))).to.equal(b(expectedCss));
            done();
        });
    });
    describe('config option optIn=false', function() {
        it('encapsulates if optKey is absent', function(done) {
            const fakeFile = new File({
                contents: new Buffer(sampleCss),
                path: path.join(__dirname, './fixtures/normal/yay.css'),
            });
            const encapsulateCss = gulpEncapsulateCss({optKey: 'optkey'});
            encapsulateCss.write(fakeFile);
            encapsulateCss.once('data', function(file) {
                expect(file.isBuffer()).to.be.true;
                expect(b(file.contents.toString('utf8'))).to.equal(b(expectedCss));
                done();
            });
        });
        it('encapsulates if optKey is false', function(done) {
            const fakeFile = new File({
                contents: new Buffer(sampleCss),
                path: path.join(__dirname, './fixtures/optkeyfalse/yay.css'),
            });
            const encapsulateCss = gulpEncapsulateCss({optKey: 'optkey'});
            encapsulateCss.write(fakeFile);
            encapsulateCss.once('data', function(file) {
                expect(file.isBuffer()).to.be.true;
                expect(b(file.contents.toString('utf8'))).to.equal(b(expectedCss));
                done();
            });
        });
        it('DOES NOT encapsulate if optKey is true', function(done) {
            const fakeFile = new File({
                contents: new Buffer(sampleCss),
                path: path.join(__dirname, './fixtures/optkeytrue/yay.css'),
            });
            const encapsulateCss = gulpEncapsulateCss({optKey: 'complex.path[0]'});
            encapsulateCss.write(fakeFile);
            encapsulateCss.once('data', function(file) {
                expect(file.isBuffer()).to.be.true;
                expect(b(file.contents.toString('utf8'))).to.equal(b(sampleCss));
                done();
            });
        });
    });
    describe('config option optIn=true', function() {
        it('DOES NOT encapsulates if optKey is absent', function(done) {
            const fakeFile = new File({
                contents: new Buffer(sampleCss),
                path: path.join(__dirname, './fixtures/normal/yay.css'),
            });
            const encapsulateCss = gulpEncapsulateCss({optIn: true, optKey: 'optkey'});
            encapsulateCss.write(fakeFile);
            encapsulateCss.once('data', function(file) {
                expect(file.isBuffer()).to.be.true;
                expect(b(file.contents.toString('utf8'))).to.equal(b(sampleCss));
                done();
            });
        });
        it('DOES NOT encapsulates if optKey is false', function(done) {
            const fakeFile = new File({
                contents: new Buffer(sampleCss),
                path: path.join(__dirname, './fixtures/optkeyfalse/yay.css'),
            });
            const encapsulateCss = gulpEncapsulateCss({optIn: true, optKey: 'optkey'});
            encapsulateCss.write(fakeFile);
            encapsulateCss.once('data', function(file) {
                expect(file.isBuffer()).to.be.true;
                expect(b(file.contents.toString('utf8'))).to.equal(b(sampleCss));
                done();
            });
        });
        it('encapsulates if optKey is true', function(done) {
            const fakeFile = new File({
                contents: new Buffer(sampleCss),
                path: path.join(__dirname, './fixtures/optkeytrue/yay.css'),
            });
            const encapsulateCss = gulpEncapsulateCss({optIn: true, optKey: 'complex.path[0]'});
            encapsulateCss.write(fakeFile);
            encapsulateCss.once('data', function(file) {
                expect(file.isBuffer()).to.be.true;
                expect(b(file.contents.toString('utf8'))).to.equal(b(expectedCss));
                done();
            });
        });
    });
});