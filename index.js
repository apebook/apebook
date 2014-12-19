//类似express的路由规则
var router = require('koa-router');
var registerRouter = require('./router');
var registerApi = require('./api-router');
var models = require('./model/index');
//github内容聚合器
//app koa实例
var Ju = function(options){
    var ju = this;
    if(!options) return false;

    var app = options.app;
    if(!app) return false;

    if (!(ju instanceof Ju)) {
        return new Ju(options);
    }else{
        ju.app = app;
        ju._init();
        //返回中间件供koa使用
        return ju.middleware();
    }
};
Ju.prototype = {
    _init: function(){
        var self = this;
        var app = self.app;
        if(!app) return false;
        if(!app.redirect) app.use(router(app));
        //初始化models
        models(app);
        //注册router
        registerRouter(app);
        registerApi(app);
    },
    //注入koa的中间件
    middleware: function(){
        var self = this;
        return function *render(next){

        }
    }
};

module.exports = Ju;