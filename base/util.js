var _ = require('underscore');
module.exports = _.extend({},_,{
    //数据校验失败
    //跳转到指定页面
    authError: function(path){
        if(!this.haveValidationError()) return false;
        var errors = this.validationErrors();
        var oError = {};
        _.each(errors,function(error){
            oError[error.param] = error.msg;
        });
        this.session._errors = oError;
        this.redirect(path);
    },
    //路由数据
    //合并系统设置
    //xtemplate可以获取配置项内容
    routerData: function(data){
        return _.extend({},this.config,data);
    },
    //输出json
    json: function(data){
        var query = this.request.query;
        var callback = query.callback;
        var output = JSON.stringify({
           result : data,
           success: true
        });
        if(callback){
            output = callback + '('+output+')';
        }
        this.body = output;
    },
    //输出错误消息
    error: function(msg){
        var query = this.request.query;
        var callback = query.callback;
        var output = JSON.stringify({
            success: false,
            msg: msg
        });
        if(callback){
            output = callback + '('+output+')';
        }
        this.body = output;
    },
    //model抛出的错误信息
    mError: function(msg){
        return {"success":false,msg:msg};
    },
    //model成功处理数据后返回的标示
    mSuccess: function(){
        return {"success":true};
    },
    //拼接api路由
    apiPath: function(name){
        return '/api/'+name;
    },
    //获取github的token
    //不存在前往github页面登录
    token: function(url){
        //var config = self.config;
        //配置不校验session
        //用于debug时跳过session校验
        //if(config && !config.auth) return false;
        var session = this.session;
        var token = session.githubToken;
        if (!token && url) {
            this.redirect('/github/auth?redirect_uri='+url);
        }
        return token;
    }
});
