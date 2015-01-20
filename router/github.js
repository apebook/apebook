var utility = require('utility');
var util = require('util');
module.exports = function(app) {
    var options = app.config.github;
    app.get('/github/callback',function *(){

    });
    //跳转到github登陆授权页面
    app.get('/github/sign',function *(){
        var state = utility.randomString();
        var query = this.request.query;
        var url = query.back;
        var redirectUrl = 'https://github.com/login/oauth/authorize?';
        redirectUrl = util.format('%sclient_id=%s&redirect_uri=%s&scope=%s&state=%s',url, options.clientID, options.callbackURL, options.scope, state);

        this.session._githubredirect = redirect;

        this.redirect(redirectUrl);
    })
};