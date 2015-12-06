var ctlGithub = require('../controller/github');
var check = require('../base/check-middleware');

module.exports = function(app){
    app.get('/api/github/repos',check.apiLogin,ctlGithub.repos);
    app.get('/api/github/orgs',check.apiLogin,ctlGithub.orgs);
    app.get('/api/github/clean',check.apiLogin,ctlGithub.cleanOrgsRepos);
};