//书籍创建、管理
var _ = require('../base/util');
var parse = require('co-busboy');
var fs = require('fs');
var BookCtrl = require('../base/book');

/**
 * 同步图书代码
 */
function *sync(body){
    var userName = this.session['user'] && this.session['user'].name || '';
    if(this.session['user']){
        userName = this.session['user'].name;
    }
    if(body){
        userName = body.owner;
    }else{
        body = yield this.request.body;
        this.log('[/api/book/sync] :');
        this.log(body);
    }

    var id = body.id;

    var mBook = this.model.book;
    //事件记录
    var mHistory = this.model.history;
    var book = this.book;

    //没有绑定github仓库
    if(!book.bindGithub){
        _.error.bind(this)('请先绑定github仓库');
        return false;
    }

    yield mHistory.add(book.id,'action','开始同步 github 仓库内容到服务器上',userName);

    var bookCtrl = new BookCtrl({
        user:book.userName,
        book: book.uri,
        githubUrl:book.githubUrl,
        oss:this.oss,
        bucket:this.config.ossBuckets.book,
        env:this.config.env,
        data: book,
        apebookHost: this.config.host,
        assetHost: this.config.assetHost
    });
    var pullResult = yield bookCtrl.pull();
    this.log(pullResult);

    if(!pullResult.success){
        this.error(pullResult);
        yield mHistory.add(book.id,'error','github 内容同步失败，失败原因如下：<br />'+pullResult,userName);
    }else{
        yield mHistory.add(book.id,'github','github 内容同步成功',userName);
        //pullResult.change = true;
        //存在文件变更，渲染html
        pullResult.change = true;
        if(pullResult.change){
            var renderResult = yield bookCtrl.render();
            //渲染失败
            if(!renderResult.success){
                this.error(renderResult);
                pullResult =  renderResult;
                yield mHistory.add(book.id,'error','gitbook渲染失败，请检查 md 文件',userName);
            }else{
                yield mHistory.add(book.id,'success','使用 gitbook 渲染成功',userName);
                //渲染成功后，将文件上传到oss
                var result = yield bookCtrl.pushOss();
                this.log('upload to oss success');
                var chapterCount = yield bookCtrl.chapterCount();
                //最新更新时间、章节数写入数据库
                yield mBook.post({id:id,updateTime:_.now(),chapterCount:chapterCount});

                var readeMeHtml = yield bookCtrl.readMe();
                var summaryHtml = yield bookCtrl.summary();
                yield mBook.readMe(id,readeMeHtml);
                yield mBook.summary(id,summaryHtml);
                yield mBook.nearestUpdate(id);
                yield mHistory.add(book.id,'success','书籍成功同步到 cdn',userName);
            }
        }
    }
    this.body = pullResult;
}

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
        book.view = yield mView.incr(book.id,this.session,mBook);
        var mUser = this.model.user;
        book.author = yield mUser.getByName(book.userName);
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
        data.title = '图书设置';
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
            //事件记录
            var mHistory = this.model.history;
            yield mHistory.add(data.id,'create','添加一本新书：《'+body.name+'》',user.name);

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
        this.log('[book.bindGithubPage]:');
        var githubToken = this.session['githubToken'];
        var data = {
            book: this.book,
            githubToken: githubToken,
            dash: true,
            currentNav: 'github',
            id: this.book.id
        };
        data.githubTo = _.githubCallback.bind(this)(this.url);
        if(githubToken){
            var user = this.session['user'];
            //是否已经绑定了github账号
            data.bindGithubUser = user.bindGithub && user.bindGithub === 'true' || false;
            if(data.bindGithubUser){
                data.githubUser = user.github;
            }
        }

        yield this.html('dash/bind-github',data);
    },
    //绑定 github
    //post
    bindGithub: function*(){
        //必须保证github登录
        _.toGithub.bind(this)();

        var body = yield this.request.body;
        this.log('[book.bindGithub] :');
        this.log(body);

        this.checkBody('user', 'github用户名不可以为空').notEmpty();
        this.checkBody('user', '用户名存在不合法字符').isUri();
        this.checkBody('repo', 'github仓库名不可以为空').notEmpty();
        var mGithub = this.model.github;
        var user = this.session['user'];
        var mBook = this.model.book;
        var hasBind = yield mGithub.hasBind(body.repo,body.user,user.id,this.id);
        if(hasBind){
            _.addError.bind(this)('repo',body.user+'/'+body.repo+'仓库已经绑定过了，无法重复绑定');
        }
        var url = this.url;
        var isError = _.authError.bind(this)(url,body);

        if(!isError){
            var githubPath = 'https://github.com/'+body.user+'/'+body.repo+'.git';
            this.log('book bind github path:'+githubPath);
            //将github信息存入书籍信息中
            var bookData = yield mBook.post({
                id:this.id,
                githubUrl:githubPath,
                githubUser:body.user,
                githubRepo:body.repo,
                bindGithub:true
            });
            this.log(bookData);
            //事件记录
            var mHistory = this.model.history;
            yield mHistory.add(this.id,'github','图书设置 github 仓库绑定成功<br /><a href="'+githubPath+'">'+githubPath+'</a>',user.name);

            mGithub.auth.bind(this)();

            var addHookResult = yield mGithub.addHook(body.repo,body.user,this.id);
            this.log(addHookResult);
            if(addHookResult.success){
                var hookPath = addHookResult.data.config.url;
                yield mBook.post({id:this.id,hook:hookPath});
                yield mHistory.add(this.id,'github','图书设置同步 hook 成功，hook 地址：<br />'+hookPath,user.name);
            }

            this.redirect(url);
        }
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
    },
    /**
     * 同步github仓库
     * api
     */
    sync: function*(){
        yield sync.bind(this)();
    },
    /**
     * github repo hook
     * @returns {boolean}
     */
    hook: function*(){
        var body = yield this.request.body;
        var repository = body.repository;
        var name = repository.name;
        this.log(name + ' trigger sync hook');
        this.log(body);
        var id = this.params.id;
        var mBook = this.model.book;
        var book = yield mBook.getById(id);
        if(!book){
            this.body = {success:false,msg:'图书不存在'};
            return false;
        }
        this.book = book;
        yield sync.bind(this)({
            id: id,
            owner: repository.owner.login
        });
    },
    /**
     * 书籍书籍页面
     */
    data: function*(){
        var book = this.book;
        var mView = this.model.view;
        var count = yield mView.count(book.id);
        yield this.html('dash/data',{book:this.book,count:count,dash:true,id:book.id});
    },
    /**
     * api 获取数据数据
     */
    apiData: function*(){
        var book = this.book;
        var mView = this.model.view;
        var views = yield mView.list(book.id,15);
        _.json.bind(this)({views:views});
    }
};