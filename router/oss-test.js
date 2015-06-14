var oss = require('../base/oss');
//oss test
module.exports = function(app) {
    app.get('/oss/push',function *(){
        //var oss = this.oss;
//        var buckets = yield oss.listBuckets();
//        var filepath = './public/gulpfile.js';
//        var object = yield oss.put('assets/gulpfile.js', filepath);
//        console.log(object);
        yield oss.dir('./public/build','assets');
    })
};