var _ = require('../base/util');
module.exports = {
  /**
   * 获取用户的组织
   */
  orgs: function*(){
    var user = this.user;
    var githubUser = user.github;
    this.log('[github.orgs]:');
    if(!githubUser){
      _.error.bind(this)('没有绑定github账号');
      return false;
    }
    var mGithub = this.model.github;
    mGithub.auth.bind(this)();
    var orgs = yield mGithub.orgs(githubUser.login);
    this.log(orgs);
    if(orgs.success){
      _.json.bind(this)(orgs.data);
    }else{
      _.error.bind(this)(orgs.msg);
    }
  },
  /**
   * 获取用户的仓库
   */
  repos: function*(){
    var userName = this.request.query.userName;
    var isOrg = this.request.query.isOrg;
    this.log('[github.repos]:'+userName);
    if(!userName){
      return _.error.bind(this)('缺少github用户名');
    }
    var mGithub = this.model.github;
    var user = this.user;
    mGithub.auth.bind(this)();
    var repos = yield mGithub.repos(userName,user.id,isOrg);
    if(repos.success){
      this.log('get repos success');
      _.json.bind(this)(repos.data);
    }else{
      _.error.bind(this)(repos.msg);
    }
  },
  /**
   * 清理组织与仓库数据
   */
  cleanOrgsRepos: function*(){
    var id = this.request.query.id;
    var mGithub = this.model.github;
    var user = this.user;
    var githubUser = user.github.login;
    yield mGithub.cleanOrgsRepos(githubUser,user.id);
    this.redirect('/book/'+id+'/bind-github');
  }
};