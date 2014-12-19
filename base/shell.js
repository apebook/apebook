//shelljs对koa的包裹

var shell = require('shelljs');

function exec(command){
    return function(fn){
        shell.exec(command, function(err, output){
            if (err) return fn(err);
            fn(null, output);
        });
    }
}

module.exports = {
    exec: exec,
    test:shell.test
};