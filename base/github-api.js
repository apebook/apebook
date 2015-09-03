var debug = require('debug')('github');
var urllib = require('co-urllib');
var API = 'https://api.github.com/';
var GitHubApi = require("github");
var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    pathPrefix: "none", // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
        "user-agent": "apebook" // GitHub is happy with a unique user agent
    }
});
github.authenticate({
    type: "oauth",
    key: "1f70a5a2b666fc22b5c0",
    secret: "3d81d447d49cd7368dd00a74c700fa7ecf53bb4f"
});
//接口返回错误的处理
function apiError(result){
    if(result.status !== 200){
        //接口调用失败
        debug('github api ：%s',result.data.message);
        return {
            success: false,
            status: result.status,
            message: result.data.message
        };
    };
    return false;
}

var GithubApi = module.exports = {
    //获取仓库信息
    repo: function *(name,user){
        if(!name || !user){
            throw new Error('缺少name或user参数')
        }
        var api = API + 'repos/'+user+'/'+name;
        var authOptions = {
            dataType: 'json'
        };
        var result = yield urllib.request(api, authOptions);
        var error = apiError(result);
        if(error) return error;
        //调用成功
        var data = result.data;
        return {
            success: true,
            status: result.status,
            data: {
                description : data.description,
                html_url: data.html_url,
                forks_count: data.forks_count,
                stargazers_count: data.stargazers_count,
                watchers_count: data.watchers_count,
                updated_at: data.updated_at,
                user: user,
                repo: name
            }
        };
    },
    //给仓库增加hook
    addHook: function *(name,user){
        if(!name || !user){
            throw new Error('缺少name或user参数')
        }
        github.authenticate({
            type: "oauth",
            token: this.session['githubToken']
        });
        return new Promise(function(resolve, reject){
            github.repos.createHook({
                repo: name,
                user: user,
                events: ["push"],
                name: "web",
                config: {
                    "url":"http://www.apebook.org/api/github/hook",
                    "content_type":"json"
                }
            },function(err,result){
                if(err){
                    console.log(err);
                    reject(err);
                }else{
                    resolve(result);
                }
            });
        });
    },
    //获取用户的仓库列表
    repos: function*(user){
        var redis = this.redis;
            var cacheKey = 'cache:repos:'+user;
        var repos = yield redis.get(cacheKey);
        if(repos){
            return JSON.parse(repos);
        }
        var api = API + 'users/'+user+'/repos'+'?sort=created&direction=desc';
        var authOptions = {
            dataType: 'json'
        };
        var result = yield urllib.request(api, authOptions);
        var error = apiError(result);
        if(error) return error;
        //调用成功
        var data = result.data;
        data = {
            success: true,
            status: result.status,
            data: data
        };
        yield redis.set(cacheKey,JSON.stringify(data));
        yield redis.expire(cacheKey,1200);
        return data;
    }
};