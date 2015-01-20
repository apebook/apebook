var parse = require('co-body');
var _ = require('../base/util');
var validator = require('koa-validator');

//用户相关的路由
module.exports = function(app) {
    //用户注册
    app.get('/join',function *(){
        yield this.html('join',{});
    });

    //用户注册
    app.post('/join',function *(){
        var body = this.request.body;
        this.checkBody('email', 'email格式不合法').isEmail();

        _.authError.bind(this)('/join');
    })
};