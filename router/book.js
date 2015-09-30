var _ = require('../base/util');
var debug = require('debug')('apebook');
var githubApi = require('../base/github-api');
var check = require('../base/check-middleware');
var ctlBook = require('../controller/book');
//书籍相关的路由
module.exports = function(app){
    var mCat = app.model.cat;
    var config = app.config;
    //选择创建书籍的方式
    //app.get('/new',check.login,ctlBook.selectType);
    //关联github
    //app.get('/new/github',check.login,function *(){
    //    var data = {title:'创建一本新书',type:'github'};
    //    data.cats = yield mCat.list();
    //    var github = this.session._github;
    //
    //    if(github){
    //        debug('存在_github session',github);
    //        var repo = github.repo;
    //        var user = github.user;
    //
    //        var userKey = config.github.userKey;
    //        var githubUser = this.session[userKey];
    //        if(github.user !== githubUser.login){
    //            _.addError.bind(this)('user','用户名跟github名不匹配');
    //        }
    //        //仓库信息
    //        var repoData = yield githubApi.repo(repo,user);
    //        if(!repoData.success){
    //            //覆盖最常见的仓库找不到的错误
    //            if(repoData.status === 404){
    //                repoData.message = '该仓库不存在';
    //            }
    //            _.addError.bind(this)('repo',repoData.message);
    //        }
    //        delete this.session._github;
    //        var isError = _.authError.bind(this)('/new/github',github);
    //        if(!isError){
    //            this.session.book = _.extend(repoData.data,github);
    //            this.redirect('/new/direct');
    //        }
    //    }
    //
    //    yield this.html('association-github',data);
    //});
    //
    //app.post('/new/github',function *(){
    //    _.login.bind(this)();
    //
    //    var body = this.request.body;
    //    debug(body);
    //    this.checkBody('user', 'github用户名不可以为空').notEmpty();
    //    this.checkBody('repo', 'github仓库名不可以为空').notEmpty();
    //    var isError = _.authError.bind(this)('/new/github',body);
    //    if(!isError){
    //        var callbackURL = this.url;
    //        var router = config.githubPath+callbackURL;
    //        this.session._github = body;
    //        this.redirect(router);
    //    }
    //});
    //创建书籍表单页面
    app.get('/new',check.login,ctlBook.bookForm);
    //书籍详情
    app.param('uri',check.uriExist).get('/book/:uri',ctlBook.detail);

    //书籍控制台
    app.param('id',check.bookExist).get('/book/:id/dashboard',check.login,ctlBook.dashboard);
    app.param('id',check.bookExist).get('/book/:id/setting',check.login,ctlBook.setting);
    app.param('id',check.bookExist).post('/book/:id/setting',check.login,ctlBook.saveSetting);
    app.param('id',check.bookExist).get('/book/:id/bind-github',check.login,ctlBook.bindGithubPage);
    app.param('id',check.bookExist).get('/book/:id/save-github',check.login,ctlBook.saveGithub);
    app.param('id',check.bookExist).post('/book/:id/bind-github',check.login,ctlBook.bindGithub);

    //创建书籍
    app.post('/new',check.login,ctlBook.create);

    //书籍主题
    app.param('id',check.bookExist).get('/book/:id/theme',check.login,ctlBook.theme);
};