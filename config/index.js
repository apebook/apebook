//应用配置文件
//Author: minghe <minghe36@126.com>

var path = require('path');
module.exports = {
    appName: 'apebook',
    //端口号配置
    port: 7070,
    host: 'http://localhost:7070',
    //是否开启调试，调试的情况下会输出错误信息
    debug: true,
    // 是否开启快照
    snapshot: true,
    //redis数据库连接配置
    redis:{
        host: 'localhost',
        port: 6379
    },
    //github配置
    github:{
        clientID: '1f70a5a2b666fc22b5c0',
        clientSecret: '3d81d447d49cd7368dd00a74c700fa7ecf53bb4f',
        callbackURL: 'http://localhost:7070/api/github/callback',
        scope: ['user','public_repo','read:repo_hook','write:repo_hook'],
        userKey: 'user',
        timeout: 10000
    },
    //模板所在的目录
    viewDir: path.join(__dirname,'..','view'),
    logDir: path.join(__dirname,'..', 'log'),
    //静态文件所在的目录
    staticDir: path.join(__dirname,'..', 'public'),
    //github仓库同步位置
    repoDir: path.join(__dirname,'..', 'repo')
};