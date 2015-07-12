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
    app.post('/api/book/cover',check.apiLogin,ctlBook.cover);

    //同步书籍
    app.post('/api/book/sync',function *(){
        var body = yield this.request.body;
        var id = body.id;
        this.log('[/api/book/sync] :');
        this.log(body);
        if(!id){
            _.error.bind(this)('书籍id不可以为空');
            return false;
        }
        var mBook = this.model.book;
        var book = yield mBook.getById(id);
        if(!book){
            _.error.bind(this)('书籍数据不存在');
            return false;
        }
        //没有绑定github仓库
        if(!book.bindGithub){
            _.error.bind(this)('请先绑定github仓库');
            return false;
        }
        var pullResult = yield bookCtrl.pull(book);
        if(!pullResult.success){
            this.error(pullResult);
        }
        this.body = pullResult;
    });


};