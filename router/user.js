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
    app.get('/login',ctlUser.login);
    app.post('/login',ctlUser.postLogin);

    //注销
    app.get('/logout',function *(){
        delete this.session.user;
        this.redirect('/login');
    });

    app.get('/setting',check.login,ctlUser.settings);
    app.post('/setting',check.login,ctlUser.postSettings);
    app.get('/password',check.login,ctlUser.password);
    app.post('/password',check.login,ctlUser.postPassword);
    app.get('/github',check.login,ctlUser.github);

};