var util = require('../base/util');
var shell = require('../base/shell');
var Github = require('../base/github');
var ctlBook = require('../controller/book');

module.exports = function(app){
    var config = app.config;
    var repoDir = config.repoDir;
    var github = new Github({repoDir:repoDir});
    //克隆库
    app.get(util.apiPath('repo/clone'),function *(){
        var user = 'minghe';
        var name = 'blog';
        var repoPath = 'https://github.com/'+user + '/' + name + '.git';
        var output = yield shell.exec('cd '+ repoDir + ' && mkdir '+user+' && cd '+user+' && git clone ' + repoPath);
        this.body = output;
    });
    //更新库内容
    app.get(util.apiPath('repo/pull/:user/:name'),function *(){
        var params = this.params;
        var user = params.user;
        var name = params.name;
        var output = yield github.pull(user,name);

        this.body = output;
    });
};