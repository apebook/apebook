var _ = require('underscore');
var crypto = require('crypto');
module.exports = _.extend({},_,{
    //数据校验失败
    //跳转到指定页面
    authError: function(path,body){
        if(!this.haveValidationError()) return false;
        var errors = this.validationErrors();
        var oError = {};
        _.each(errors,function(error){
            oError[error.param] = error.msg;
        });
        this.session._errors = oError;
        if(body){
            this.session._body = body;
        }
        this.redirect(path);
        return true;
    },
    //添加错误消息
    addError: function(param,msg){
        if(!this._validationErrors){
            this._validationErrors = [];
        }
        return this._validationErrors.push({param:param,msg:msg});
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
            this.body = output;
        }else{
            this.body = JSON.parse(output);
        }
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
    },
    //md5编码
    md5: function(value){
        var md5 = crypto.createHash('md5');
        md5.update(value, 'utf8');
        return md5.digest('hex');
    },
    //登录
    login: function(){
        var user = this.session.user;
        //登录
        if(!user){
            this.redirect('/login?redirect_url='+this.originalUrl);
        }
        return user;
    },
    //是否已经登录
    user: function(){
        return this.session.user;
    },
    /**
     * 跳转到github页面
     */
    toGithub: function(url){
        if(!this.session['githubToken']){
            //跳转到github授权页面
            var goTo = '/github/save';
            //github登录后跳转回来的地址
            this.session['githubTo'] = url || this.url;
            this.redirect(this.config.githubPath+goTo);
            return false;
        }
    },
    githubCallback: function(url){
        return this.config.githubPath+'/github/save?to='+ url;
    }
});
