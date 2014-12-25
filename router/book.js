var parse = require('co-body');
var _ = require('../base/util');
//书籍相关的路由
module.exports = function(app){
    var mBook = app.model.book;
    var mCat = app.model.cat;
    //创建书籍表单页面
    app.get('/new',function *(){
        var data = {title:'创建一本新书'};
        yield this.render('new',data);
    });

    app.get('/new/github',function *(){
        var data = {title:'创建一本新书'};
        data.cats = yield mCat.list();
        var query = this.request.query;
        if(query.error){
            data.error = query.error;
        }
        yield this.render('association-github',data);
    });

    app.get('/new/direct',function *(){
        var data = {title:'创建一本新书'};
        data.cats = yield mCat.list();
        var query = this.request.query;
        if(query.error){
            data.error = query.error;
        }
        yield this.render('new-direct',data);
    });

    //创建书籍
    app.post('/new',function *(){
        var body = yield parse(this, { limit: '1kb' });
        body.author = '明河';
        var data = yield mBook.post(body);
        //出错了，跳转到表单创建页面
        if(!data.success){
            this.redirect('/new?error='+data.msg);
        }else{
            //跳转到我的书籍
            this.redirect('/'+body.name+'/dashboard');
        }
    });
    //书籍控制台
    app.get('/:name/dashboard',function*(){
        var self = this;
        var params = self.params;
        var bookName = params['name'];
        var data = yield mBook.get(bookName);
        yield this.render('new',data);
    });
};