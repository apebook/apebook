//书籍创建、管理
var _ = require('../base/util');
var parse = require('co-busboy');
var fs = require('fs');
module.exports = {
    //书籍详情页面
    detail: function*(){
        var book = this.book;
        yield this.html('book-detail',book);
    },
    //选择书籍创建方式
    selectType: function *(){
        var data = {title:'选择创建书籍的方式',type:'select'};
        yield this.html('new',data);
    },
    //书籍信息填写表单
    bookForm: function *(){
        this.log('[book.directType]');
        var mCat = this.model.cat;
        var data = {title:'创建一本新书',type:'direct'};
        //获取书籍分类
        data.cats = yield mCat.list();
        var book = this.session.book;
        this.log(book);
        if(book){
            this.log('user use github');
            book.githubUser = book.user;
            data.type = 'fromGithub';
            data = _.extend(data,book);
        }
        yield this.html('new-direct',data);
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
            //存在github用户名，添加hook
            if(body.githubUser && body.repo) {
                body.bindGithub = true;
                //yield githubApi.addHook(body.repo,body.user);
                delete this.session.book;
            }
            var data = yield mBook.post(body);
            this.log('create book success');
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
        var mBook = this.model.book;
        var githubUser = this.session.github_user;
        var githubParam = this.session._github;
        //不存在表单提交的数据跳转到表单页面
        if(!githubParam){
            this.redirect('/book/'+this.id+'/bind-github');
            return false;
        }
        //github没有登录授权过
        if(!githubUser){
            //跳转到github授权页面
            var router = this.config.githubPath+this.url;
            this.redirect(router);
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
    }
};