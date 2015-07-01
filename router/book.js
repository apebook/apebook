var _ = require('../base/util');
var debug = require('debug')('apebook');
var githubApi = require('../base/github-api');
var check = require('../base/check-middleware');
var ctrBook = require('../controller/book');
//书籍相关的路由
module.exports = function(app){
    var mBook = app.model.book;
    var mCat = app.model.cat;
    var config = app.config;
    //选择创建书籍的方式
    app.get('/new',check.login,ctrBook.create);
    //关联github
    app.get('/new/github',check.login,function *(){
        var data = {title:'创建一本新书',type:'github'};
        data.cats = yield mCat.list();
        var github = this.session._github;

        if(github){
            debug('存在_github session',github);
            var repo = github.repo;
            var user = github.user;

            var userKey = config.github.userKey;
            var githubUser = this.session[userKey];
            if(github.user !== githubUser.login){
                _.addError.bind(this)('user','用户名跟github名不匹配');
            }
            //仓库信息
            var repoData = yield githubApi.repo(repo,user);
            if(!repoData.success){
                //覆盖最常见的仓库找不到的错误
                if(repoData.status === 404){
                    repoData.message = '该仓库不存在';
                }
                _.addError.bind(this)('repo',repoData.message);
            }
            delete this.session._github;
            var isError = _.authError.bind(this)('/new/github',github);
            if(!isError){
                this.session.book = _.extend(repoData.data,github);
                this.redirect('/new/direct');
            }
        }

        yield this.html('association-github',data);
    });

    app.post('/new/github',function *(){
        _.login.bind(this)();

        var body = this.request.body;
        debug(body);
        this.checkBody('user', 'github用户名不可以为空').notEmpty();
        this.checkBody('repo', 'github仓库名不可以为空').notEmpty();
        var isError = _.authError.bind(this)('/new/github',body);
        if(!isError){
            var callbackURL = this.url;
            var router = config.githubPath+callbackURL;
            this.session._github = body;
            this.redirect(router);
        }
    });

    //创建书籍表单页面
    app.get('/new/direct',function *(){
        _.login.bind(this)();

        var data = {title:'创建一本新书',type:'direct'};
        data.cats = yield mCat.list();
        var book = this.session.book;
        if(book){
            book.githubUser = book.user;
            data.type = 'fromGithub';
            data = _.extend(data,book);
        }
        yield this.html('new-direct',data);
    });

    //创建书籍
    app.post('/new',function *(){
        _.login.bind(this)();

        var body = yield this.request.body;
        this.checkBody('name', '书名不可以为空').notEmpty();
        this.checkBody('uri', '不可以为空').notEmpty();
        this.checkBody('uri', '只能是字母、数字、-').isUri();
        this.checkBody('cat', '必须选择一个类目').notEmpty();
        var isExist = yield mBook.isExist(body.name);
        if(isExist){
            _.addError('name','书名已经存在');
        }
        var isUriExist = yield mBook.isUriExist(body.uri);
        if(isUriExist){
            _.addError('uri','uri已经存在');
        }
        var error = _.authError.bind(this)('/new/direct',body);
        if(!error){
            var user = _.user.bind(this)();
            body.userId = user.id;
            body.userName = user.name;
            debug('创建书籍数据：');
            debug(body);
            var data = yield mBook.post(body);
            //添加hook
            if(body.githubUser && body.repo) {
                //yield githubApi.addHook(body.repo,body.user);
                delete this.session.book;
            }
            //跳转到我的书籍
            this.redirect('/book/'+body.uri+'/dashboard');
        }
    });
    //书籍控制台
    app.get('/book/:uri/dashboard',function*(){
        _.login.bind(this)();

        var self = this;
        var params = self.params;
        var uri = params['uri'];
        var data = yield mBook.get(uri,'uri');
        debug('获取的书籍信息：');
        debug(data);
        //导航选中我的书籍
        data.nav = 'book';
        yield this.html('book-dashboard',data);
    });
};