var _ = require('../base/util');
var ctlUser = require('../controller/user');
var check = require('../base/check-middleware');
//用户相关的路由
module.exports = function(app) {
    var mUser = app.model.user;

    //用户注册
    app.get('/join',ctlUser.join);

    //用户注册
    app.post('/join',ctlUser.postJoin);

    //登录
    app.get('/login',function *(){
        var redirect_url = this.request.query.redirect_url || '/';
        yield this.html('login',{redirect_url:redirect_url});
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
        if(!isError){
            this.session.user = yield mUser.data(id);
            //重定向
            this.redirect(body.redirect_url || '/');
        }
    });

    //注销
    app.get('/logout',function *(){
        delete this.session.user;
        this.redirect('/login');
    });

    app.get('/setting',check.login,ctlUser.settings);
    app.post('/setting',check.login,ctlUser.postSettings);
};