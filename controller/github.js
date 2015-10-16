var _ = require('../base/util');
module.exports = {
  /**
   * 获取用户的组织
   */
  orgs: function*(){
    var user = this.user;
    this.log('[github.orgs]:');
    var mGithub = this.model.github;
    mGithub.auth.bind(this)();
    var orgs = yield mGithub.orgs(user.id);
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
    this.log('[github.repos]:'+userName);
    if(!userName){
      return _.error.bind(this)('缺少github用户名');
    }
    var mGithub = this.model.github;
    var user = this.user;
    var repos = yield mGithub.reposByUser(userName,user.id);
    this.log(repos);
    _.json.bind(this)(repos);
  }
};