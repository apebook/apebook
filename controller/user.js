//用户登录、注册、注销等

var _ = require('../base/util');
var parse = require('co-busboy');

module.exports = {
    //用户注册
    join: function *(){
        this.title = 'apebook 用户注册';
        yield this.html('join');
    },
    //提交注册
    postJoin: function *(){
        var body = this.request.body;
        this.log('user post join data :');
        this.log(body);
        this.checkBody('email', 'email格式不合法').isEmail();
        this.checkBody('name', '用户名不可以为空').notEmpty();
        this.checkBody('password', '密码不可以为空').notEmpty();
        var mUser = this.model.user;
        var isExist = yield mUser.isExist(body.name);
        if(isExist){
            this.log('user name exist');
            _.addError.bind(this)('name','用户名已经存在');
        }
        var isEmailExist = yield mUser.isExist(body.email,'email');
        if(isEmailExist){
            this.log('user email exist');
            _.addError.bind(this)('email','邮箱已经存在');
        }
        _.authError.bind(this)('/join',body);
        yield mUser.post(body);
        this.redirect('/');
    },
    //用户设置
    settings: function*(){
        this.title = 'apebook 用户设置';
        var mUser = this.model.user;
        var user = this.session.user;
        var id = yield mUser.id('name',user.name);
        var data = yield mUser.data(id);

        yield this.html('user/setting',data);
    },
    //保存设置
    postSettings: function*(){
        var body = this.request.body;
        this.log('user post setting data :');
        this.log(body);
        this.checkBody('email', 'email格式不合法').isEmail();
        var mUser = this.model.user;
        _.authError.bind(this)('/setting',body);
        yield mUser.post(body);
        this.redirect('/setting');
    },
    //上传头像
    avatar: function*(){
        this.log('user.avatar');
        var oss = this.oss;
        //存储书籍封面的oss桶
        var bucket = this.config.ossBuckets.asset;
        var parts = parse(this);
        var part;
        while (part = yield parts) {
            var mime = part.mime;
            if(!mime) continue;
            //必须是图片
            if(!/^image\/(\w+)/.test(mime)){
                this.body = {"status":0,message:"只允许上传图片"};
                return false;
            }
            //上传到服务器的目录
            var dir = 'avatar/';
            var result = yield oss.uploadImg(part,bucket,dir);
            this.log(result);
            var url = this.config.assetHost+'/'+result.name;
            this.body = {status:1,type:"ajax",name:result.name,url:url};
        }
    }
};