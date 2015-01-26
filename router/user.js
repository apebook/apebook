var parse = require('co-body');
var _ = require('../base/util');

//用户相关的路由
module.exports = function(app) {
    var mUser = app.model.user;

    //用户注册
    app.get('/join',function *(){
        yield this.html('join',{});
    });

    //用户注册
    app.post('/join',function *(){
        var body = this.request.body;
        this.checkBody('email', 'email格式不合法').isEmail();
        this.checkBody('name', '用户名不可以为空').notEmpty();
        this.checkBody('password', '密码不可以为空').notEmpty();
        var isExist = yield mUser.isExist(body.name);
        if(isExist){
            _.addError.bind(this)('name','用户名已经存在');
        }
        var isEmailExist = yield mUser.isExist(body.email,'email');
        if(isEmailExist){
            _.addError.bind(this)('email','邮箱已经存在');
        }
        _.authError.bind(this)('/join',body);
        var success = yield mUser.post(body);
        this.redirect('/');
    });

    //登录
    app.get('/login',function *(){
        yield this.html('login',{});
    });
    app.post('/login',function *(){
        var body = this.request.body;
        this.checkBody('name', '用户名不可以为空').notEmpty();
        this.checkBody('password', '密码不可以为空').notEmpty();
        var id = yield mUser.id('name',body.name);
        if(id === -1){
            id = yield mUser.id('email',body.email);
        }
        //不存在该用户
        if(id === -1){
            _.addError.bind(this)('name','该用户名不存在');
        }else{
            var pass = yield mUser.authPassword(id,body.password);
            if(!pass){
                _.addError.bind(this)('password','密码错误，请重新输入');
            }
        }
        var isError = _.authError.bind(this)('/login',body);
        !isError && this.redirect('/');
    });
};