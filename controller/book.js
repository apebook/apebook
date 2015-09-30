//书籍创建、管理
var _ = require('../base/util');
var parse = require('co-busboy');
var fs = require('fs');
var githubApi = require('../base/github-api');
module.exports = {
    /**
     * 通过书籍id获取书籍
     */
    getById: function*(){
        var book = this.book;
        var mView = this.model.view;
        book.view = yield mView.incr(book.id,this.session);
        _.json.bind(this)(book);
    },
    //书籍详情页面
    detail: function*(){
        var book = this.book;
        var mBook = this.model.book;
        book.readeMe = yield mBook.readMe(book.id);
        book.summary = yield mBook.summary(book.id);
        var mView = this.model.view;
        book.view = yield mView.incr(book.id,this.session);
        var mUser = this.model.user;
        book.author = yield mUser.data(book.userId);
        book.userBookCount = yield mUser.bookCount(book.id);
        yield this.html('book-detail',book);
    },
    //书籍信息填写表单
    bookForm: function *(){
        this.log('[book.create]');
        var data = {title:'创建一本新书'};
        yield this.html('new-direct',data);
    },
    /**
     * 书籍设置
     */
    setting: function*(){
        var data = this.book;
        data.title = '书籍设置';
        data.cats = this.model.cat.all();
        data.langs = this.model.lang.all();

        yield this.html('dash/book-setting',data);
    },
    /**
     * 保存书籍设置
     */
    saveSetting: function*(){
        var body = yield this.request.body;
        this.log('[book.saveSetting] :');
        this.log(body);

        var mBook = this.model.book;
        var data = yield mBook.post(body);

        this.redirect('/book/'+data.id+'/setting');
    },
    //创建书籍
    create: function *(){
        var body = yield this.request.body;
        this.log('[book.create] :');
        this.log(body);
        this.checkBody('name', '书名不可以为空').notEmpty();
        this.checkBody('uri', '不可以为空').notEmpty();
        this.checkBody('uri', '只能是字母、数字、-').isUri();
        this.checkBody('cat', '必须选择一个类目').notEmpty();
        this.checkBody('lang', '必须选择一个编程语言').notEmpty();
        var mBook = this.model.book;
        var isExist = yield mBook.isExist(body.name);
        if(isExist){
            _.addError('name','书名已经存在');
        }
        var isUriExist = yield mBook.isUriExist(body.uri);
        if(isUriExist){
            _.addError('uri','uri已经存在');
        }
        //出错了跳转到表单创建页面
        var error = _.authError.bind(this)('/new/direct',body);
        if(!error){
            var user = _.user.bind(this)();
            body.userId = user.id;
            body.userName = user.name;
            body.status = 'new';
            body.bindGithub = false;
            body.cover = '';
            this.log('book data');
            this.log(body);
            var data = yield mBook.post(body);
            this.log('create book success');
            var mUser = this.model.user;
            yield mUser.books(user.id,data.id);
            //跳转到我的书籍
            this.redirect('/book/'+data.id+'/dashboard');
        }
    },
    //书籍控制台
    dashboard:function*(){
        var data = this.book;
        //显示书籍管理菜单
        data.dash = true;
        data.currentNav = 'index';
        this.log('book data :');
        this.log(data);
        yield this.html('book-dashboard',data);
    },
    //书籍主题
    theme: function*(){
        var data = this.book;
        data.dash = true;
        data.currentNav = 'theme';
        yield this.html('dash/theme',data);
    },
    //书籍封面
    cover: function*(){
        var mBook = this.model.book;
        var oss = this.oss;
        //存储书籍封面的oss桶
        var bucket = this.config.ossBuckets.cover;
        var parts = parse(this);
        var part;
        var id;
        while (part = yield parts) {
            //获取书籍id
            if(_.isArray(part)&& part[0] === 'id'){
                id = part[1];
                if(!id){
                    this.body = {"status":0,message:"缺少id"};
                    return false;
                }
                continue;
            }
            var mime = part.mime;
            if(!mime) continue;
            //必须是图片
            if(!/^image\/(\w+)/.test(mime)){
                this.body = {"status":0,message:"只允许上传图片"};
                return false;
            }
            var result = yield oss.uploadImg(part,bucket);
            var coverUrl = this.config.coverHost+result.name;
            //将url存到数据库中
            var bookData = yield mBook.post({id:id,cover:coverUrl});
            this.log(bookData);
            this.body = {status:1,type:"ajax",name:result.name,url:coverUrl};
        }
    },
    //书籍绑定 github 仓库表单页面
    bindGithubPage: function *(){
        var data = this.book;
        data.dash = true;
        data.currentNav = 'github';
        var user = this.session['user'];
        //是否已经绑定了github账号
        data.bindGithubUser = user.bindGithub && user.bindGithub === 'true' || false;
        if(data.bindGithubUser){
            var mUser = this.model.user;
            data.githubUser = yield mUser.github(user.id);
        }
        var repos = yield githubApi.repos.bind(this)(data.githubUser.login);
        if(repos.success){
            data.repos = repos.data;
        }

        yield this.html('dash/bind-github',data);
    },
    //绑定 github
    //post
    bindGithub: function*(){
        var body = yield this.request.body;
        this.log('[book.bindGithub] :');
        this.log(body);

        this.checkBody('user', 'github用户名不可以为空').notEmpty();
        this.checkBody('user', '用户名存在不合法字符').isUri();
        this.checkBody('repo', 'github仓库名不可以为空').notEmpty();

        var url = this.url;
        var isError = _.authError.bind(this)(url,body);
        if(!isError){
            this.session._github = body;
            this.redirect('/book/'+this.id+'/save-github');
        }
    },
    //保存数据到github中
    saveGithub: function*(){
        if(!this.session['githubToken']){
            //跳转到github授权页面
            var router = this.config.githubPath+this.url;
            this.redirect(router);
            return false;
        }
        var mBook = this.model.book;
        var user = this.session['user'];
        //是否已经绑定了github账号
        var bindGithubUser = user.bindGithub && user.bindGithub === 'true' || false;
        var githubParam = this.session._github;
        //不存在表单提交的数据跳转到表单页面
        if(!githubParam){
            this.redirect('/book/'+this.id+'/bind-github');
            return false;
        }
        //已经存在github账号绑定
        this.log('[book.saveGithubPath]:');
        if(!this.id){
            this.error('不存在 id');
            yield this.html('error',{msg:'id参数不存在！'});
            return false;
        }
        //将github路径保存到数据库中
        var githubPath = 'https://github.com/'+githubParam.user+'/'+githubParam.repo+'.git';
        this.log('book bind github path:'+githubPath);
        //将github信息存入书籍信息中
        var bookData = yield mBook.post({
            id:this.id,
            githubUrl:githubPath,
            githubUser:githubParam.user,
            githubRepo:githubParam.repo,
            bindGithub:true
        });
        this.log(bookData);
        delete this.session._github;
        yield githubApi.addHook.bind(this)(githubParam.repo,githubParam.user);
        this.redirect(this.url);
    },
    //更新书籍信息
    post: function*(){
        var body = yield this.request.body;
        this.log('[book.post] :');
        this.log(body);
        var mBook = this.model.book;
        var book = yield mBook.post(body);
        this.body = {success:true,data:book};
    },
    //校验书籍 uri 是否已经存在
    exist: function*(){
        var uri = this.request.query.uri;
        if(!uri){
            this.body = {exist:false};
            return false;
        }
        var mBook = this.model.book;
        var isUriExist = yield mBook.isUriExist(uri);
        this.body = {exist:isUriExist};
    },
    /**
     * 是否已经存在该书籍名
     * @returns {boolean}
     */
    existName: function*(){
        var name = this.request.query.name;
        if(!name){
            this.body = {exist:false};
            return false;
        }
        var mBook = this.model.book;
        var exist = yield mBook.isExist(name);
        this.body = {exist:exist};
    }
};