//用户登录、注册、注销等

var _ = require('../base/util');

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
    }
};