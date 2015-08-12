//应用配置文件
//Author: minghe <minghe36@126.com>

var path = require('path');
var local = require('./local');
var _ = require('../base/util');
var config = {
    title:'apebook 猿书 程序员的图书馆',
    appName: 'apebook',
    //端口号配置
    port: 9090,
    host: '//apebook.org/',
    coverHost:'//cover.apebook.org/',
    //书籍地址
    bookHost:'//book.apebook.org',
    assetHost:'//a.apebook.org',
    //kissy 静态资源的包配置
    kissyPkg: 'http://a.apebook.org',
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
        callbackURL: 'http://www.apebook.org/github/callback',
        scope: ['user','public_repo','read:repo_hook','write:repo_hook'],
        userKey: 'github_user',
        timeout: 10000
    },
    //触发github授权的路由
    githubPath:'/github/auth?redirect_uri=',
    //模板所在的目录
    viewDir: path.join(__dirname,'..','view'),
    logDir: path.join(__dirname,'..', 'log'),
    //静态文件所在的目录
    staticDir: path.join(__dirname,'..', 'public'),
    //github仓库同步位置
    repoDir: path.join(__dirname,'..', 'repo'),
    "oss":{
        accessKeyId: 'R7wBScg51UDJv06B',
        accessKeySecret: '8rkUyvVcDbNFOBsxnxRdGGGhg6qyZb',
        bucket: 'apebook',
        region: 'oss-cn-hangzhou'
    },
    "ossBuckets":{
        asset: 'apebook-asset',
        book: 'apebook-book',
        cover: 'apebook-cover'
    }
};
if(process.env.NODE_ENV == 'local'){
    config = _.extend(config,local);
}
var occupation = require('./occupation');
config.occupations = occupation;
var cats = require('./cat');
config.cats = cats;
module.exports = config;