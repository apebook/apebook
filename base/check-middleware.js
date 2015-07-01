//用来校验参数与登录的通用中间件
module.exports = {
    //登录检查
    login: function*(next){
        var user = this.session.user;
        //登录
        if(!user){
            this.redirect('/login?redirect_url='+this.originalUrl);
            return false;
        }
        yield next;
    }
};