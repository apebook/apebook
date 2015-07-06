//书籍相关的api
var _ = require('../base/util');
var shell = require('../base/shell');
var BookCtrl = require('../base/book');

var ctlBook = require('../controller/book');
var check = require('../base/check-middleware');
module.exports = function(app){
    var mBook = app.model.book;
    var bookCtrl = new BookCtrl();
    //渲染md文件成html文件
    app.get('/api/book/render',function *(){

        //var body = yield parse(this, { limit: '1kb' });
//        var user = body.user;
//        var repo = body.repo;

        var user = 'minghe';
        var book = 'blog';
        var output = yield bookCtrl.render(user,book);
        if(output===true){
            _.json.bind(this)({user: user,book: book});
        }else{
            _.error.bind(this)(output);
        }

    });

    //同步书籍
    app.get('/api/book/sync',function *(){

        var user = 'minghe';
        var book = 'blog';
        var output = yield bookCtrl.pull(user,book);
    });

    app.get('/api/book/clone',function *(){

        var user = 'minghe';
        var book = 'blog';
        var output = yield bookCtrl.clone(user,book);
//        if(output===true){
//            _.json.bind(this)({user: user,book: book});
//        }else{
//            _.error.bind(this)(output);
//        }

    });

    app.get('/api/book/is',function *(){
        var user = 'minghe';
        var book = 'blog';
        var output = yield bookCtrl.isBook(user,book);
    });

    //书籍封面
    app.post('/api/book/cover',check.login,ctlBook.cover);
};