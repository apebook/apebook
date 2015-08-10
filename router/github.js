
module.exports = function(app) {
    app.get('/github/callback',function *(){
        var githubUser = this.session['github_user'];
        var mUser = this.model.user;
        var user = this.session['user'];
        yield mUser.github(user.id,githubUser);
    });
};