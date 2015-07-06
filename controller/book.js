//书籍创建、管理
var _ = require('../base/util');
var parse = require('co-busboy');
module.exports = {
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
            this.redirect('/book/'+body.uri+'/dashboard');
        }
    },
    //书籍控制台
    dashboard:function*(){
        this.log('[book.dashboard]');
        var self = this;
        var params = self.params;
        var uri = params['uri'];
        var mBook = this.model.book;
        var data = yield mBook.get(uri,'uri');
        if(!data){
            this.error('%s is not exist',uri);
            yield this.html('error',{msg:'不存在该书籍！'});
            return false;
        }
        this.log('book data :');
        this.log(data);
        //导航选中我的书籍
        data.nav = 'book';
        yield this.html('book-dashboard',data);
    },
    //书籍封面
    cover: function*(){
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
                continue;
            }
            var mime = part.mime;
            if(!mime) continue;
            //必须是图片
            if(!/^image\/(\w+)/.test(mime)){
                this.body = '{"status":0,message:"只允许上传图片"}';
                return false;
            }
            var name = part.filename;
            var result = yield oss.uploadImg(part,len,bucket);
            this.log(result);
            //_.json.bind(this)({status:1,type:"ajax",name:name,url:'//'+this.config.coverHost+result.name});

//            var stream = fs.createWriteStream(target);
//            part.pipe(stream);
//            part.on('end',function(){
//                self.body = '{"status":1,"type":"ajax","name":"'+part.filename+'","url":"http://'+self.host+'/'+newFileName+'"}';
//            })
        }
//        var body = yield this.request.body;
//        this.log('[book.cover] :');
//        this.log(body);
//        this.checkBody('id', '书籍id不可以为空').notEmpty();

    }
};