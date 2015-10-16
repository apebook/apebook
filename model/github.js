/**
 * github 数据
 */
var _ = require('../base/util');
var Base = require('./base');
var urllib = require('co-urllib');
var API = 'https://api.github.com/';
var GitHubApi = require("github");

var github = new GitHubApi({
  // required
  version: "3.0.0",
  timeout: 10000
});

//接口返回错误的处理
function apiError(result){
  if(result.status !== 200){
    return {
      success: false,
      status: result.status,
      message: result.data.message
    };
  }
  return false;
}
/**
 * 返回promise包装后的内容
 * @param fn
 */
function promise(fn,params){
  return new Promise(function(resolve,reject){
    fn(params || {},function(err,data){
      if(err){
        console.log(err.message);
        data = {success:false,msg:err.message};
      }else{
        data = {success:true,data:data};
      }
      resolve(data);
    });
  });
}

var Github = module.exports = function(){
  this.redis = null;
  this.keyPre = 'github:';
};

Github.prototype = _.extend({},Base,{
  /**
   * token校验
   */
  auth: function(){
    var token = this.session['githubToken'];
    github.authenticate({
      type: "oauth",
      token: token
    });
  },
  /**
   * 获取用户组织
   */
  orgs: function*(userId){
    var cacheKey = 'github:user:orgs:'+userId;
    var orgs = yield this.cache(cacheKey);
    if(orgs){
      return JSON.parse(orgs);
    }
    var data = yield promise(github.user.getOrgs);
    if(_.isArray(data) && data.length>0){
      yield this.cache(cacheKey,data);
    }
    return data;
  },
  /**
   * 通过用户名获取仓库
   * @param user
   */
  reposByUser: function*(user,userId){
    var cacheKey = 'github:user:repos:'+user;
    var repos = yield this.cache(cacheKey);
    //if(repos){
    //  return JSON.parse(repos);
    //}
    var api = API + 'users/'+user+'/repos'+'?sort=created&direction=desc';
    var authOptions = {
      dataType: 'json'
    };
    var result = yield new Promise(function(resolve, reject){

    });
    var error = apiError(result);
    if(error) return error;
    //调用成功
    var data = result.data;
    var mUser = this.model.user;
    var books = yield mUser.books(userId);
    //排除掉已经添加过图书
    data = data.filter(function(repo){
      var has = false;
      books.forEach(function(book){
        if(book.githubRepo === repo.name){
          has = true;
        }
      });
      return !has;
    });
    data = {
      success: true,
      status: result.status,
      data: data
    };
    yield this.cache(cacheKey,data);
    return data;
  }
});