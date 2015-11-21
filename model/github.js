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
  orgs: function*(user){
    var redis = this.redis;
    var key = 'github:user:orgs:'+user;
    var orgs = yield redis.get(key);
    if(orgs){
      return JSON.parse(orgs);
    }
    var data = yield promise(github.user.getOrgs);
    if(data.success){
      yield redis.set(key,JSON.stringify(data));
    }
    return data;
  },
  /**
   * 通过用户名获取仓库
   * @param user
   */
  repos: function*(user,userId,isOrg){
    var redis = this.redis;
    var key = 'github:user:repos:'+userId+':'+user;
    var repos = yield redis.get(key);
    if(repos){
      repos = JSON.parse(repos);
    }else{
      var params = {user:user,org:user,type:'all',sort:'pushed',direction:'desc',per_page:500};
      if(isOrg && isOrg === 'true'){
        repos = yield promise(github.repos.getFromOrg,params);
      }else{
        repos = yield promise(github.repos.getFromUser,params);
      }
    }
    if(repos.success){
      yield redis.set(key,JSON.stringify(repos));
    }
    return repos;
  },
  /**
   * 判断一个仓库是否已经绑定过
   * @param repo
   * @param user
   * @param userId
   * @returns {boolean}
   */
  hasBind: function*(repo,user,userId,bookId){
    var has = false;

    //过滤掉已经绑定仓库
    var mUser = this.model.user;
    var books = yield mUser.books(userId);

    books.forEach(function(book){
      if(book.id != bookId){
        if(book.githubRepo === repo && book.githubUser === user){
          has = true;
        }
      }
    });
    return has;
  },
  /**
   * 清理组织与仓库数据
   * @param user
   * @param userId
   * @returns {boolean}
   */
  cleanOrgsRepos: function*(user,userId){
    var redis = this.redis;
    yield redis.del('github:user:orgs:'+user);
    var keys = yield redis.keys('github:user:repos:'+userId+':*');
    if(keys.length){
      for(var i=0;i<keys.length;i++){
        yield redis.del(keys[i]);
      }
    }
    return true;
  },
  /**
   * 添加hook
   * @param repo
   * @param user
   * @param bookId
   * @returns {*}
   */
  addHook: function*(repo,user,bookId){
    var hasHook = false;
    var url = 'http://apebook.org/api/book/'+bookId+'/sync';
    var hooks = yield promise(github.repos.getHooks,{
      repo: repo,
      user: user
    });
    console.log(hooks);
    if(hooks.success){
      if(hooks.data.length){
        hasHook = hooks.data.some(function(hook){
          return hook.config.url === url;
        });
        if(hasHook){
          return {success: true,has:true};
        }
      }
    }
    return yield promise(github.repos.createHook,{
      repo: repo,
      user: user,
      events: ['push','pull_request'],
      name: "web",
      config: {
        "url":url,
        "content_type":"json"
      }
    });

  }
});