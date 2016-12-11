// note this code is modeled after https://github.com/visionmedia/debug
// but I tend not to trust certain code, so it is re-purposed

//core
const util = require('util');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

//npm
const moment = require('moment');
const colors = require('colors/safe');

//project
const debugEnv = String(process.env.SUMAN_DEBUG).split(',').map(function (item) {
    return (item instanceof RegExp ? item : new RegExp(item));
});

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const availableColors = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
    'gray',
    'grey',
    'background colors',
    'bgBlack',
    'bgRed',
    'bgGreen',
    'bgYellow',
    'bgBlue',
    'bgMagenta',
    'bgCyan',
    'bgWhite'
];

const noop = function () {
};
const useColors = true;

// const fns = {};

function createColoredString(d, foreground, background) {
    var item = colors;
    if (foreground) {
        item = item[foreground]
    }
    if (background) {
        item = item[background]
    }
    if (true || bold) {
        item = item.bold
    }

    return item(d);
}

function findMatch(str) {
    for (var i = 0; i < debugEnv.length; i++) {
        var m;
        if (m = String(str).match(debugEnv[i])) {
            return true;
        }
    }
    return false;
}

function createDebuggerFn(str, opts) {

    assert(typeof str === 'string',
        ' => suman-debug project => usage error => please pass a string identifier as first arg.');
    opts = opts || {};

    const timemask = opts.timemask || opts.tm || 'HH:mm:ss:ms a';
    assert(typeof timemask === 'string', '"timemask"/"tm" property passed to suman-debug must be a string.');

    const foreground = opts.fg || opts.foreground || 'cyan';
    // var background = opts.bg || opts.background || 'bgWhite';
    var background = opts.bg || opts.background;
    var lfp = opts.lfp || opts.logFilePath || path.resolve(process.env.HOME + '/.suman/suman-debug.log');

    if (lfp) {
        assert(path.isAbsolute(lfp), ' => suman-debug project => log file path is not absolute => ' + lfp);
    }

    if (foreground) {
        assert(availableColors.indexOf(foreground) > -1, ' => Color chosen is not available => ' + foreground);
    }

    if (background) {
        if (!String(background).startsWith('bg')) {
            background = 'bg' + capitalizeFirstLetter(background);
        }
        assert(availableColors.indexOf(background) > -1, ' => Color chosen is not available => ' + background);
    }


    var fn, m;

    // if(fn = fns[str]){
    //   return fn;
    // }
    if (!findMatch(str)) {
        return noop;
    }
    else {
        fn = function () {

            try {
                fs.writeFileSync(lfp,
                    ' => Beginning of debugging output on ' + new Date() + ', via SUMAN_DEBUG=' + str,
                    {flag: 'wx', flags: 'wx'});
            }
            catch (err) {
                if (!String(err.stack || err).match(/EEXIST/i)) {
                    console.error(' => suman-debug project =>  could not log debug data to log file => ',
                        '\n', (err.stack || err));
                }
            }

            const args = Array.prototype.slice.call(arguments);
            const data = args.map(function (a) {

                const d = (typeof a === 'string' ? a : util.inspect(a));

                // fs.writeFileSync(lfp, d, {flags: 'w', flag: 'w'}, function (err) {
                //     if (err) {
                //         console.error('\n', err.stack || err, '\n');
                //     }
                // });

                fs.writeFileSync(lfp, d, {flags: 'a', flag: 'a'});

                if (useColors) {
                    return createColoredString(d, foreground, background);
                }
                else {
                    return d;
                }

            }).join('\n------------------------------------------------------------------------\n');


            process.stderr.write('\n\n' + colors.blue('SUMAN_DEBUG=') + '"' + colors.blue.bold(str) + '"' + ' @'
                + colors.cyan.bold(moment().format(timemask)) + '\n' + data + '\n\n');

        };

        // fns[str] = fn;
        return fn;
    }

}

module.exports = createDebuggerFn;