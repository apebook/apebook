//应用配置文件
//Author: minghe <minghe36@126.com>

var path = require('path');
module.exports = {
    appName: '聚js',
    //端口号配置
    port: 3000,
    host: 'http://localhost:3000',
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
        clientID: '6187abaeee72e5207718',
        clientSecret: '539387508f0ae7a6024abe1d79571397fb90261c',
        callbackURL: 'http://localhost:3000/api/github/callback',
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