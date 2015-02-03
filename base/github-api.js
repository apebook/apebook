var debug = require('debug')('github');
var urllib = require('co-urllib');
var API = 'https://api.github.com/';

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
        var api = API + 'repos/'+user+'/'+name+'/hooks';
        var authOptions = {
            type:'post',
            data:{
                events: ["push","pull_request"],
                name: "web",
                active: true,
                config: {
                    "url":"http://www.apebook.org/api/github/hook",
                    "content_type":"json"
                }
            },
            dataType: 'json'
        };
        var result = yield urllib.request(api, authOptions);
        debug('addHook ：%s',result);
        var error = apiError(result);
        if(error) return error;
    }
};