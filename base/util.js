var _ = require('underscore');
module.exports = _.extend({},_,{
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
