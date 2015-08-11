
module.exports = function(app) {
    app.get('/github/callback',function *(){
        var githubUserKey = this.config.github.userKey;
        var githubUser = this.session[githubUserKey];
        var mUser = this.model.user;
        var user = this.session['user'];
        yield mUser.github(user.id,githubUser);
    });
};